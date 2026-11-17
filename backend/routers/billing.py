from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette.requests import Request as StarletteRequest

from config import FRONTEND_URL, STRIPE_PREMIUM_PRICE_ID, STRIPE_PRICE_IDS, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from database import get_db
from deps import require_auth, require_guardian
from helpers import get_family_id, get_family_owner, is_family_subscribed
from models import DBUser
from responses import fail, ok
from schemas import CheckoutBody

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


@router.get("/api/billing/plans")
def get_billing_plans(user: DBUser = Depends(require_auth)):
    """Live price info for whichever plan(s) are configured, read straight
    from Stripe so the frontend never hardcodes a dollar amount. The annual
    plan is simply omitted (not an error) when STRIPE_PREMIUM_PRICE_ID_ANNUAL
    isn't set -- lets the picker UI gracefully degrade to monthly-only."""
    if not STRIPE_SECRET_KEY:
        return ok([])
    plans = []
    for plan_id, price_id in STRIPE_PRICE_IDS.items():
        if not price_id:
            continue
        try:
            price = stripe.Price.retrieve(price_id)
        except stripe.error.StripeError:
            continue
        plans.append({
            "id": plan_id,
            "amount": (price.unit_amount or 0) / 100,
            "currency": price.currency.upper(),
            "interval": price.recurring.interval if price.recurring else None,
        })
    return ok(plans)


@router.get("/api/billing/status")
def get_billing_status(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    owner = get_family_owner(db, user)
    return ok({
        "isPremium": is_family_subscribed(db, user),
        "status": owner.subscription_status if owner else "inactive",
        "currentPeriodEnd": owner.subscription_current_period_end if owner else None,
    })


@router.post("/api/billing/checkout")
def create_checkout_session(body: CheckoutBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    _require_stripe_configured()
    price_id = STRIPE_PRICE_IDS.get(body.plan)
    if not price_id:
        fail(f"The '{body.plan}' plan isn't available.", 400, code="plan_unavailable")

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
        line_items=[{"price": price_id, "quantity": 1}],
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
