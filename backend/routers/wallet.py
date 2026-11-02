from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from content_filter import check_content
from database import get_db
from deps import require_auth, require_kid
from helpers import get_family_id, now
from models import DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import SavingsTransferBody, WalletGoalBody

router = APIRouter()

# Transaction types that represent the kid actually earning points, as opposed
# to spending (spent/deduct/behaviour_deduct) or just moving points between
# balance and savings (saved/withdrawn, net zero to total wealth either way).
_EARNING_TYPES = ("earned", "bonus", "behaviour")


def _lifetime_earned(db: Session, kid_id: str) -> float:
    total = db.query(func.coalesce(func.sum(DBTransaction.amount), 0)).filter(
        DBTransaction.kid_id == kid_id, DBTransaction.type.in_(_EARNING_TYPES),
    ).scalar()
    return float(total or 0)


@router.get("/api/wallet")
def get_all_wallets(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "guardian":
        family_id = get_family_id(user)
        kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    else:
        kids = [user]

    result = []
    for k in kids:
        wallet = db.query(DBWallet).filter(DBWallet.kid_id == k.id).first()
        tx_count = db.query(DBTransaction).filter(DBTransaction.kid_id == k.id).count()
        result.append({"kidId": k.id, "name": k.name,
                        "balance": wallet.balance if wallet else 0,
                        "savingsBalance": wallet.savings_balance if wallet else 0,
                        "lifetimeEarned": _lifetime_earned(db, k.id),
                        "transactionCount": tx_count})
    return ok(result)


@router.get("/api/wallet/{kid_id}")
def get_wallet(kid_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "kid" and user.id != kid_id:
        fail("Forbidden — you can only view your own wallet", 403)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid").first()
    if not kid: fail("Kid not found", 404)

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    txs    = db.query(DBTransaction).filter(DBTransaction.kid_id == kid_id)\
               .order_by(DBTransaction.timestamp.desc()).all()

    return ok({"kidId": kid_id, "name": kid.name,
               "balance": wallet.balance if wallet else 0,
               "savingsBalance": wallet.savings_balance if wallet else 0,
               "lifetimeEarned": _lifetime_earned(db, kid_id),
               "goalName": wallet.goal_name if wallet else None,
               "goalTarget": wallet.goal_target if wallet else None,
               "transactions": [{"id": t.id, "type": t.type, "amount": t.amount,
                                  "description": t.description, "timestamp": t.timestamp}
                                 for t in txs]})


@router.put("/api/wallet/goal")
def set_wallet_goal(body: WalletGoalBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    """Kids set their own savings goal -- a motivational label + target tied to
    their existing savings_balance, not a real-money action, so no guardian
    approval is needed. Passing no name/target clears the goal."""
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=user.id, balance=0, savings_balance=0)
        db.add(wallet)

    if not body.name and not body.target:
        wallet.goal_name = None
        wallet.goal_target = None
    else:
        if not body.name or len(body.name.strip()) < 2:
            fail("Goal name must be at least 2 characters")
        check_content(body.name)
        if not body.target or body.target <= 0:
            fail("Goal target must be a positive number of points")
        wallet.goal_name = body.name.strip()
        wallet.goal_target = body.target

    db.commit()
    db.refresh(wallet)
    return ok({"goalName": wallet.goal_name, "goalTarget": wallet.goal_target})


@router.post("/api/wallet/savings/deposit")
def deposit_to_savings(body: SavingsTransferBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    if body.amount <= 0: fail("Amount must be greater than zero")
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet or wallet.balance < body.amount:
        fail(f"Insufficient balance. Need {body.amount:g}, have {wallet.balance if wallet else 0:g}")

    wallet.balance -= body.amount
    wallet.savings_balance = (wallet.savings_balance or 0) + body.amount
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="saved",
                         amount=body.amount, description=f"Moved {body.amount:g} pts to savings", timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"balance": wallet.balance, "savingsBalance": wallet.savings_balance})


@router.post("/api/wallet/savings/withdraw")
def withdraw_from_savings(body: SavingsTransferBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    if body.amount <= 0: fail("Amount must be greater than zero")
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet or (wallet.savings_balance or 0) < body.amount:
        fail(f"Insufficient savings. Need {body.amount:g}, have {(wallet.savings_balance if wallet else 0):g}")

    wallet.savings_balance -= body.amount
    wallet.balance += body.amount
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="withdrawn",
                         amount=body.amount, description=f"Moved {body.amount:g} pts from savings", timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"balance": wallet.balance, "savingsBalance": wallet.savings_balance})
