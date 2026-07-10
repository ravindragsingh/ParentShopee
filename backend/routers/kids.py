from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from content_filter import check_content
from database import get_db
from deps import require_auth, require_parent
from helpers import get_family_id, now, safe_user
from models import DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import AddKidBody, BehaviourBody, BonusPointsBody, UpdateKidPasswordBody, WalletAdjustBody
from security import check_password_complexity

router = APIRouter()


@router.get("/api/users/kids")
def list_kids(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()
    return ok([safe_user(k) for k in kids])


@router.get("/api/users/parents")
def list_parents(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    parents = db.query(DBUser).filter(DBUser.role == "parent").all()
    return ok([safe_user(p) for p in parents])


@router.post("/api/kids")
def add_kid(body: AddKidBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    count = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).count()
    if count >= 10:
        fail("You can add a maximum of 10 children")
    if db.query(DBUser).filter(DBUser.username == body.username.strip()).first():
        fail("Username already taken")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_password_complexity(body.password)

    kid = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="kid",
        parent_id=family_id,
        avatar=body.avatar or "🐶",
    )
    db.add(kid)
    db.flush()   # get kid.id before commit
    db.add(DBWallet(kid_id=kid.id, balance=0))
    db.commit()
    db.refresh(kid)
    return ok(safe_user(kid), 201)


@router.post("/api/kids/{kid_id}/bonus")
def award_bonus(kid_id: str, body: BonusPointsBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    if body.points <= 0:
        fail("Points must be greater than 0")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += body.points
    db.add(DBTransaction(
        id=str(uuid4()), kid_id=kid_id, type="bonus",
        amount=body.points,
        description=body.reason.strip() if body.reason and body.reason.strip() else "Bonus points",
        timestamp=now(),
    ))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "pointsAwarded": body.points, "newBalance": wallet.balance})


@router.post("/api/kids/{kid_id}/wallet/adjust")
def adjust_wallet(kid_id: str, body: WalletAdjustBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if body.amount == 0:
        fail("Amount cannot be zero")
    if body.reason and len(body.reason.strip()) > 15:
        fail("Message must be 15 characters or fewer")
    check_content(body.reason or "")
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()
    new_balance = wallet.balance + body.amount
    if new_balance < 0:
        fail(f"Cannot deduct more than current balance ({int(wallet.balance)} pts)")
    wallet.balance = new_balance
    tx_type = "bonus" if body.amount > 0 else "deduct"
    desc = body.reason.strip() if body.reason and body.reason.strip() else ("Bonus points" if body.amount > 0 else "Points adjusted")
    db.add(DBTransaction(id=str(uuid4()), kid_id=kid_id, type=tx_type, amount=abs(body.amount),
                         description=desc, timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "adjustment": body.amount, "newBalance": wallet.balance})


@router.post("/api/kids/{kid_id}/behaviour")
def award_behaviour(kid_id: str, body: BehaviourBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if body.points == 0:
        fail("Points cannot be zero")
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()
    if body.points < 0 and wallet.balance + body.points < 0:
        fail(f"Cannot remove more than current balance ({int(wallet.balance)} pts)")
    wallet.balance += body.points
    tx_type = "behaviour" if body.points > 0 else "behaviour_deduct"
    desc = "Bonus received for good behaviour" if body.points > 0 else "Good behaviour points removed"
    db.add(DBTransaction(
        id=str(uuid4()), kid_id=kid_id, type=tx_type,
        amount=abs(body.points), description=desc, timestamp=now(),
    ))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "points": body.points, "newBalance": wallet.balance})


@router.put("/api/kids/{kid_id}/password")
def update_kid_password(kid_id: str, body: UpdateKidPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    check_password_complexity(body.password)
    kid.password = body.password
    db.commit()
    return ok({"message": f"Password updated for {kid.name}"})
