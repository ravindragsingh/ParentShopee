from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_kid
from helpers import get_family_id, now
from models import DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import SavingsTransferBody

router = APIRouter()


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
               "transactions": [{"id": t.id, "type": t.type, "amount": t.amount,
                                  "description": t.description, "timestamp": t.timestamp}
                                 for t in txs]})


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
