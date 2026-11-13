from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette.requests import Request as StarletteRequest

from config import FRONTEND_URL, STRIPE_PREMIUM_PRICE_ID, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from database import get_db
from deps import require_auth, require_guardian
from helpers import get_family_id, get_family_owner, is_family_subscribed
from models import DBUser
from responses import fail, ok

router = APIRouter()

stripe.api_key = STRIPE_SECRET_KEY


def _require_stripe_configured():
    if not STRIPE_SECRET_KEY or not STRIPE_PREMIUM_PRICE_ID:
        fail("Premium subscriptions aren't configured yet — contact support.", 503, code="billing_unavailable")


def _current_period_end_iso(sub) -> str | None:
    ts = getattr(sub, "current_period_end", None)
    if not ts:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


@router.get("/api/billing/status")
def get_billing_status(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    owner = get_family_owner(db, user)
    return ok({
        "isPremium": is_family_subscribed(db, user),
        "status": owner.subscription_status if owner else "inactive",
        "currentPeriodEnd": owner.subscription_current_period_end if owner else None,
    })


@router.post("/api/billing/checkout")
def create_checkout_session(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    _require_stripe_configured()
    family_id = get_family_id(user)
    owner = db.query(DBUser).filter(DBUser.id == family_id).first()

    if not owner.stripe_customer_id:
        customer = stripe.Customer.create(email=owner.email or None, name=owner.name, metadata={"family_id": family_id})
        owner.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=owner.stripe_customer_id,
        client_reference_id=family_id,
        line_items=[{"price": STRIPE_PREMIUM_PRICE_ID, "quantity": 1}],
        success_url=f"{FRONTEND_URL}/dashboard?tab=premium&checkout=success",
        cancel_url=f"{FRONTEND_URL}/dashboard?tab=premium&checkout=cancel",
    )
    return ok({"url": session.url})


@router.post("/api/billing/portal")
def create_portal_session(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    _require_stripe_configured()
    owner = db.query(DBUser).filter(DBUser.id == get_family_id(user)).first()
    if not owner.stripe_customer_id:
        fail("You don't have a subscription to manage yet.", 400, code="no_subscription")

    session = stripe.billing_portal.Session.create(
        customer=owner.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/dashboard?tab=premium",
    )
    return ok({"url": session.url})


@router.post("/api/billing/webhook")
async def stripe_webhook(request: StarletteRequest, db: Session = Depends(get_db)):
    """Unauthenticated by design -- trust comes from verifying Stripe's
    signature below, not a Bearer token (Stripe itself is the caller)."""
    if not STRIPE_WEBHOOK_SECRET:
        fail("Webhook not configured", 503, code="billing_unavailable")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError):
        fail("Invalid signature", 400)

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        family_id = getattr(obj, "client_reference_id", None)
        customer_id = getattr(obj, "customer", None)
        subscription_id = getattr(obj, "subscription", None)
        if family_id:
            owner = db.query(DBUser).filter(DBUser.id == family_id).first()
            if owner:
                owner.stripe_customer_id = customer_id or owner.stripe_customer_id
                owner.stripe_subscription_id = subscription_id
                db.commit()

    elif event_type in ("customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"):
        customer_id = getattr(obj, "customer", None)
        owner = db.query(DBUser).filter(DBUser.stripe_customer_id == customer_id).first()
        if owner:
            owner.stripe_subscription_id = getattr(obj, "id", None)
            owner.subscription_status = "canceled" if event_type == "customer.subscription.deleted" else getattr(obj, "status", "inactive")
            owner.subscription_current_period_end = _current_period_end_iso(obj)
            db.commit()

    return ok({"received": True})
