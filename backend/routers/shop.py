from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config import LIMIT_EXTRA_SHOP_ITEMS
from content_filter import check_content
from database import get_db
from deps import require_auth, require_kid, require_parent
from helpers import check_add_limit, get_family_id, get_family_owner, now, shop_dict
from models import DBShopItem, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from sample_items import is_sample_shop_item
from schemas import ShopItemCreate, ShopItemUpdate

router = APIRouter()


@router.get("/api/shop")
def get_shop(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    fid = get_family_id(user) if user.role == "parent" else user.parent_id
    items = db.query(DBShopItem).filter(DBShopItem.family_id == fid).all()
    return ok([shop_dict(s) for s in items])


@router.post("/api/shop")
def create_shop_item(body: ShopItemCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    check_content(body.name, body.description or "")
    if body.cost < 0: fail("cost must be a non-negative number")
    from_sample = is_sample_shop_item(body.name)
    owner = get_family_owner(db, user)
    if not from_sample:
        owner = check_add_limit(db, user, "shop_items_added_count", 1, LIMIT_EXTRA_SHOP_ITEMS, "shop items")
    item = DBShopItem(id=str(uuid4()), name=body.name.strip(), description=body.description or "",
                      cost=body.cost, image_emoji=body.imageEmoji or "🎁", created_at=now(),
                      family_id=get_family_id(user))
    db.add(item)
    if not from_sample:
        owner.shop_items_added_count = (owner.shop_items_added_count or 0) + 1
    db.commit()
    db.refresh(item)
    return ok(shop_dict(item), 201)


@router.put("/api/shop/{item_id}")
def update_shop_item(item_id: str, body: ShopItemUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBShopItem).filter(DBShopItem.id == item_id).first()
    if not item: fail("Shop item not found", 404)
    if body.name        is not None: item.name        = body.name.strip()
    if body.description is not None: item.description = body.description
    if body.cost        is not None:
        if body.cost < 0: fail("cost must be a non-negative number")
        item.cost = body.cost
    if body.imageEmoji  is not None: item.image_emoji = body.imageEmoji
    db.commit()
    db.refresh(item)
    return ok(shop_dict(item))


@router.delete("/api/shop/{item_id}")
def delete_shop_item(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBShopItem).filter(DBShopItem.id == item_id).first()
    if not item: fail("Shop item not found", 404)
    db.delete(item)
    db.commit()
    return ok(shop_dict(item))


@router.post("/api/shop/{item_id}/buy")
def buy_shop_item(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    item = db.query(DBShopItem).filter(DBShopItem.id == item_id).first()
    if not item: fail("Shop item not found", 404)

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=user.id, balance=0)
        db.add(wallet)
        db.flush()

    if wallet.balance < item.cost:
        fail(f"Insufficient points. Need {item.cost}, have {wallet.balance}")

    wallet.balance -= item.cost
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="spent",
                         amount=item.cost, description=f"Bought: {item.name}", timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"item": shop_dict(item), "newBalance": wallet.balance})
