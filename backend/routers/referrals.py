from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config import CONTACT_EMAIL, FRONTEND_URL
from database import get_db
from deps import require_guardian
from email_utils import send_email
from helpers import generate_referral_code, get_family_owner, now, referral_currency_for, referral_payout_dict
from models import DBReferralPayout, DBUser
from responses import fail, ok

router = APIRouter()

# Minimum pending REFERRALS (not a currency amount) before a cash-out can be
# requested -- not a cap on how much a single cash-out pays out. A guardian
# who lets referrals pile up past 10 before cashing out gets the full pending
# amount in one go (e.g. 23 pending referrals -> a single 23-credit request),
# not capped at 10. Deliberately currency-agnostic: every currency in
# config.REFERRAL_CURRENCY_RATES is set so minCashout / perReferral == 10, so
# this one threshold works for every country without a lookup here.
MIN_CASHOUT_CREDITS = 10


@router.get("/api/referrals/me")
def get_my_referrals(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    # Referral code/count live on the primary guardian's row and are shared by
    # a co-guardian viewing the same family, same as chores_added_count etc.
    owner = get_family_owner(db, user)
    if not owner.referral_code:
        owner.referral_code = generate_referral_code(db)
        db.commit()
        db.refresh(owner)

    referral_count = owner.referral_count or 0
    redeemed = owner.referral_credits_redeemed or 0
    pending = referral_count - redeemed
    currency = referral_currency_for(owner)

    payouts = db.query(DBReferralPayout).filter(
        DBReferralPayout.guardian_id == owner.id,
    ).order_by(DBReferralPayout.created_at.desc()).all()

    return ok({
        "referralCode": owner.referral_code,
        # No separate /register route -- "mode=register" is what actually
        # switches the root screen into the registration form (see Login.jsx).
        "referralLink": f"{FRONTEND_URL}/?mode=register&ref={owner.referral_code}",
        "referralCount": referral_count,
        "creditsRedeemed": redeemed,
        "pendingCredits": pending,
        "minCashoutCredits": MIN_CASHOUT_CREDITS,
        "canCashOut": pending >= MIN_CASHOUT_CREDITS,
        # Localized by the guardian's current country -- see
        # helpers.referral_currency_for. A past payout keeps whatever
        # currency/amount it was actually requested in (see
        # referral_payout_dict), even if the guardian's country has since changed.
        "currency": currency["code"],
        "currencySymbol": currency["symbol"],
        "perReferralValue": currency["perReferral"],
        "pendingAmount": pending * currency["perReferral"],
        "minCashoutAmount": currency["minCashout"],
        "payouts": [referral_payout_dict(p) for p in payouts],
    })


@router.post("/api/referrals/cash-out")
def cash_out_referrals(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    owner = get_family_owner(db, user)
    pending = (owner.referral_count or 0) - (owner.referral_credits_redeemed or 0)
    if pending < MIN_CASHOUT_CREDITS:
        fail(f"You need at least {MIN_CASHOUT_CREDITS} unredeemed referrals to cash out — you have {pending}.")

    currency = referral_currency_for(owner)
    payout_amount = pending * currency["perReferral"]

    payout = DBReferralPayout(
        id=str(uuid4()), guardian_id=owner.id, guardian_name=owner.name,
        guardian_email=owner.email, amount=pending,
        currency=currency["code"], payout_amount=payout_amount,
        status="pending", created_at=now(),
    )
    db.add(payout)
    owner.referral_credits_redeemed = (owner.referral_credits_redeemed or 0) + pending
    db.commit()
    db.refresh(payout)

    send_email(
        CONTACT_EMAIL,
        f"[Reward Ur Kids] Referral cash-out request: {currency['symbol']}{payout_amount:g}",
        f"{owner.name} ({owner.username}, {owner.email}) requested a {currency['symbol']}{payout_amount:g} "
        f"referral cash-out ({pending} referrals, Amazon gift card). Fulfill it from the admin panel's "
        f"Referral Payouts tab.\n",
    )

    return ok(referral_payout_dict(payout), 201)
