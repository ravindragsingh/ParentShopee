from sqlalchemy import or_
from sqlalchemy.orm import Session

from firebase_app import get_firebase_app
from models import DBUser


def send_push(token: str, title: str, body: str, data: dict = None) -> None:
    """Best-effort push notification to a single device token. Never raises —
    a delivery failure (missing config, invalid/expired token, network error)
    must never break the chore-completion/approval flow it's attached to."""
    if not token:
        return
    app = get_firebase_app()
    if not app:
        return
    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=token,
        )
        messaging.send(message, app=app)
    except Exception as e:
        print(f"[push] WARNING: failed to send push notification: {e}")


def notify_guardians_of_kid(db: Session, kid: DBUser, title: str, body: str, data: dict = None) -> None:
    """Notifies the primary guardian and co-guardian (if any) of a kid's family."""
    family_id = kid.guardian_id
    if not family_id:
        return
    guardians = db.query(DBUser).filter(
        DBUser.role == "guardian",
        or_(DBUser.id == family_id, DBUser.co_guardian_of == family_id),
    ).all()
    for guardian in guardians:
        send_push(guardian.push_token, title, body, data)


def notify_kid(db: Session, kid_id: str, title: str, body: str, data: dict = None) -> None:
    kid = db.query(DBUser).filter(DBUser.id == kid_id).first()
    if kid:
        send_push(kid.push_token, title, body, data)
