from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config import LIMIT_EXTRA_SHOP_ITEMS
from content_filter import check_content
from database import get_db
from deps import require_auth, require_kid, require_parent
from helpers import check_add_limit, get_family_id, get_family_owner, now, purchase_dict, shop_dict
from models import DBShopItem, DBShopPurchase, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from sample_items import is_sample_shop_item
from schemas import ShopItemCreate, ShopItemUpdate, ShopSettingsUpdate

router = APIRouter()


@router.get("/api/shop/settings")
def get_shop_settings(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    owner = get_family_owner(db, user)
    return ok({"shopApprovalEnabled": owner.shop_approval_enabled == "1"})


@router.put("/api/shop/settings")
def update_shop_settings(body: ShopSettingsUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    owner = get_family_owner(db, user)
    owner.shop_approval_enabled = "1" if body.enabled else "0"
    db.commit()
    return ok({"shopApprovalEnabled": body.enabled})


@router.get("/api/shop/purchases")
def get_shop_purchases(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "kid":
        kid_ids = [user.id]
    else:
        family_id = get_family_id(user)
        kid_ids = [k.id for k in db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()]
        if not kid_ids:
            return ok([])
    purchases = db.query(DBShopPurchase).filter(
        DBShopPurchase.kid_id.in_(kid_ids)
    ).order_by(DBShopPurchase.created_at.desc()).limit(50).all()
    return ok([purchase_dict(p) for p in purchases])


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

    owner = get_family_owner(db, user)
    if owner.shop_approval_enabled == "1":
        purchase = DBShopPurchase(
            id=str(uuid4()), kid_id=user.id, shop_item_id=item.id, item_name=item.name,
            image_emoji=item.image_emoji or "🎁", cost=item.cost, status="pending", created_at=now(),
        )
        db.add(purchase)
        db.commit()
        db.refresh(purchase)
        return ok({"pending": True, "purchase": purchase_dict(purchase)}, 201)

    wallet.balance -= item.cost
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="spent",
                         amount=item.cost, description=f"Bought: {item.name}", timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"pending": False, "item": shop_dict(item), "newBalance": wallet.balance})


@router.post("/api/shop/purchases/{purchase_id}/approve")
def approve_shop_purchase(purchase_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    purchase = db.query(DBShopPurchase).filter(DBShopPurchase.id == purchase_id).first()
    if not purchase: fail("Purchase request not found", 404)
    kid = db.query(DBUser).filter(DBUser.id == purchase.kid_id).first()
    if not kid or kid.parent_id != get_family_id(user): fail("Not allowed to modify this request", 403)
    if purchase.status != "pending": fail("Only pending purchase requests can be approved")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == purchase.kid_id).first()
    if not wallet or wallet.balance < purchase.cost:
        fail(f"{kid.name} no longer has enough points for this (needs {purchase.cost}, has {wallet.balance if wallet else 0}).")

    wallet.balance -= purchase.cost
    db.add(DBTransaction(id=str(uuid4()), kid_id=purchase.kid_id, type="spent",
                         amount=purchase.cost, description=f"Bought: {purchase.item_name}", timestamp=now()))
    purchase.status = "approved"
    purchase.resolved_at = now()
    db.commit()
    db.refresh(purchase)
    db.refresh(wallet)
    return ok({"purchase": purchase_dict(purchase), "newBalance": wallet.balance})


@router.post("/api/shop/purchases/{purchase_id}/reject")
def reject_shop_purchase(purchase_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    purchase = db.query(DBShopPurchase).filter(DBShopPurchase.id == purchase_id).first()
    if not purchase: fail("Purchase request not found", 404)
    kid = db.query(DBUser).filter(DBUser.id == purchase.kid_id).first()
    if not kid or kid.parent_id != get_family_id(user): fail("Not allowed to modify this request", 403)
    if purchase.status != "pending": fail("Only pending purchase requests can be rejected")

    purchase.status = "rejected"
    purchase.resolved_at = now()
    db.commit()
    db.refresh(purchase)
    return ok({"purchase": purchase_dict(purchase)})
