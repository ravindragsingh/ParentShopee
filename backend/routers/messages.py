from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from content_filter import check_content
from database import get_db
from deps import require_auth
from helpers import get_family_id, now
from models import DBMessage, DBUser
from responses import fail, ok
from schemas import MessageBody

router = APIRouter()


def _msg_dict(m: DBMessage) -> dict:
    return {"id": m.id, "senderId": m.sender_id, "receiverId": m.receiver_id,
            "content": m.content, "timestamp": m.timestamp, "isRead": m.is_read,
            "quoteContent": m.quote_content}

def _family_contacts(db: Session, user: DBUser) -> list:
    """Return all users this user is allowed to message."""
    family_id = get_family_id(user)
    contacts = []
    if user.role == "parent":
        contacts += db.query(DBUser).filter(DBUser.parent_id == family_id, DBUser.role == "kid").all()
        if user.co_parent_of:
            p = db.query(DBUser).filter(DBUser.id == user.co_parent_of).first()
            if p: contacts.append(p)
        else:
            cp = db.query(DBUser).filter(DBUser.co_parent_of == user.id).first()
            if cp: contacts.append(cp)
    else:
        p = db.query(DBUser).filter(DBUser.id == user.parent_id).first()
        if p: contacts.append(p)
        cp = db.query(DBUser).filter(DBUser.co_parent_of == user.parent_id).first()
        if cp: contacts.append(cp)
    return contacts


@router.get("/api/messages/contacts")
def get_contacts(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    contacts = _family_contacts(db, user)
    result = []
    for c in contacts:
        conv_filter = or_(
            and_(DBMessage.sender_id == user.id, DBMessage.receiver_id == c.id),
            and_(DBMessage.sender_id == c.id,    DBMessage.receiver_id == user.id),
        )
        last = db.query(DBMessage).filter(conv_filter).order_by(DBMessage.timestamp.desc()).first()
        unread = db.query(DBMessage).filter(
            DBMessage.sender_id == c.id,
            DBMessage.receiver_id == user.id,
            DBMessage.is_read == "false",
        ).count()
        result.append({
            "id": c.id, "name": c.name, "role": c.role,
            "avatar": c.avatar if c.role == "kid" else None,
            "lastMessage": last.content if last else None,
            "lastMessageTime": last.timestamp if last else None,
            "unread": unread,
        })
    return ok(result)


@router.get("/api/messages/{contact_id}")
def get_conversation(contact_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    allowed = [c.id for c in _family_contacts(db, user)]
    if contact_id not in allowed:
        fail("Not allowed to message this user", 403)
    conv_filter = or_(
        and_(DBMessage.sender_id == user.id, DBMessage.receiver_id == contact_id),
        and_(DBMessage.sender_id == contact_id, DBMessage.receiver_id == user.id),
    )
    msgs = db.query(DBMessage).filter(conv_filter).order_by(DBMessage.timestamp.asc()).all()
    return ok([_msg_dict(m) for m in msgs[-20:]])  # return last 20 only


@router.post("/api/messages")
def send_message(body: MessageBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    text = body.content.strip()
    if not text:
        fail("Message cannot be empty")
    if len(text) > 60:
        fail("Message cannot exceed 60 characters")
    check_content(text)
    allowed = [c.id for c in _family_contacts(db, user)]
    if body.receiver_id not in allowed:
        fail("Not allowed to message this user", 403)
    msg = DBMessage(id=str(uuid4()), sender_id=user.id, receiver_id=body.receiver_id,
                    content=text, timestamp=now(), is_read="false",
                    quote_content=body.quote_content)
    db.add(msg); db.commit()
    # Prune conversation to 20 messages (rolling window)
    conv_filter = or_(
        and_(DBMessage.sender_id == user.id, DBMessage.receiver_id == body.receiver_id),
        and_(DBMessage.sender_id == body.receiver_id, DBMessage.receiver_id == user.id),
    )
    all_msgs = db.query(DBMessage).filter(conv_filter).order_by(DBMessage.timestamp.asc()).all()
    if len(all_msgs) > 20:
        for old in all_msgs[:len(all_msgs) - 20]:
            db.delete(old)
        db.commit()
    db.refresh(msg)
    return ok(_msg_dict(msg))


@router.put("/api/messages/{contact_id}/read")
def mark_read(contact_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    db.query(DBMessage).filter(
        DBMessage.sender_id == contact_id,
        DBMessage.receiver_id == user.id,
        DBMessage.is_read == "false",
    ).update({"is_read": "true"}, synchronize_session=False)
    db.commit()
    return ok({"marked": True})
