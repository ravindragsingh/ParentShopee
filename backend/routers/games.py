from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_kid
from helpers import get_family_id, get_family_owner, now
from models import DBFamilyGameSetting, DBGame, DBGameSession, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import GameVisibilityUpdate

router = APIRouter()


def game_dict(g: DBGame, enabled: bool = None) -> dict:
    d = {"id": g.id, "name": g.name, "description": g.description,
         "imageEmoji": g.image_emoji, "cost": g.cost, "durationMinutes": g.duration_minutes}
    if enabled is not None:
        d["enabled"] = enabled
    return d


def _family_id_for(user: DBUser) -> str:
    """The family key family_game_settings rows are keyed by -- always the
    primary guardian's id, whether the caller is that guardian, a co-guardian, or a kid."""
    if user.role == "kid":
        return user.guardian_id
    return get_family_id(user)


def _enabled_game_ids(db: Session, family_id: str) -> set:
    rows = db.query(DBFamilyGameSetting).filter(
        DBFamilyGameSetting.family_id == family_id, DBFamilyGameSetting.enabled == "1"
    ).all()
    return {r.game_id for r in rows}


def session_dict(s: DBGameSession) -> dict:
    return {"id": s.id, "kidId": s.kid_id, "gameId": s.game_id, "gameName": s.game_name,
            "imageEmoji": s.image_emoji, "cost": s.cost, "durationMinutes": s.duration_minutes,
            "status": s.status, "createdAt": s.created_at, "resolvedAt": s.resolved_at,
            "startedAt": s.started_at, "expiresAt": s.expires_at}


def _expire_stale_sessions(db: Session, sessions: list) -> None:
    """Lazily flip any 'active' session whose timer has run out to 'expired'. No
    background job needed -- every session list fetch sweeps the sessions it's
    about to return, which is the only place staleness would otherwise be visible."""
    now_dt = datetime.now(timezone.utc)
    changed = False
    for s in sessions:
        if s.status == "active" and s.expires_at:
            try:
                expires = datetime.fromisoformat(s.expires_at)
            except ValueError:
                continue
            if now_dt >= expires:
                s.status = "expired"
                changed = True
    if changed:
        db.commit()


@router.get("/api/games")
def get_games(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    games = db.query(DBGame).filter(DBGame.is_active == "1").all()
    family_id = _family_id_for(user)
    enabled_ids = _enabled_game_ids(db, family_id)
    if user.role == "kid":
        # Kids only see games their guardian has explicitly turned on.
        return ok([game_dict(g) for g in games if g.id in enabled_ids])
    # Guardians see the full catalog with each game's current visibility, so
    # they have something to toggle even for games they haven't enabled yet.
    return ok([game_dict(g, enabled=g.id in enabled_ids) for g in games])


@router.put("/api/games/{game_id}/visibility")
def set_game_visibility(game_id: str, body: GameVisibilityUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    game = db.query(DBGame).filter(DBGame.id == game_id).first()
    if not game: fail("Game not found", 404)

    family_id = get_family_id(user)
    setting = db.query(DBFamilyGameSetting).filter(
        DBFamilyGameSetting.family_id == family_id, DBFamilyGameSetting.game_id == game_id
    ).first()
    if not setting:
        setting = DBFamilyGameSetting(family_id=family_id, game_id=game_id)
        db.add(setting)
    setting.enabled = "1" if body.enabled else "0"
    db.commit()
    return ok(game_dict(game, enabled=body.enabled))


@router.get("/api/games/sessions")
def get_game_sessions(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "kid":
        kid_ids = [user.id]
    else:
        family_id = get_family_id(user)
        kid_ids = [k.id for k in db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()]
        if not kid_ids:
            return ok([])
    sessions = db.query(DBGameSession).filter(
        DBGameSession.kid_id.in_(kid_ids)
    ).order_by(DBGameSession.created_at.desc()).limit(50).all()
    _expire_stale_sessions(db, sessions)
    return ok([session_dict(s) for s in sessions])


@router.post("/api/games/{game_id}/buy")
def buy_game(game_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    game = db.query(DBGame).filter(DBGame.id == game_id, DBGame.is_active == "1").first()
    if not game: fail("Game not found", 404)
    if game.id not in _enabled_game_ids(db, _family_id_for(user)):
        fail("This game isn't available yet -- ask your guardian to enable it", 403)

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=user.id, balance=0)
        db.add(wallet)
        db.flush()

    if wallet.balance < game.cost:
        fail(f"Insufficient points. Need {game.cost}, have {wallet.balance}")

    owner = get_family_owner(db, user)
    if owner.shop_approval_enabled == "1":
        session = DBGameSession(
            id=str(uuid4()), kid_id=user.id, game_id=game.id, game_name=game.name,
            image_emoji=game.image_emoji, cost=game.cost, duration_minutes=game.duration_minutes,
            status="pending", created_at=now(),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return ok({"pending": True, "session": session_dict(session)}, 201)

    wallet.balance -= game.cost
    session = DBGameSession(
        id=str(uuid4()), kid_id=user.id, game_id=game.id, game_name=game.name,
        image_emoji=game.image_emoji, cost=game.cost, duration_minutes=game.duration_minutes,
        status="approved", created_at=now(), resolved_at=now(),
    )
    db.add(session)
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="spent",
                         amount=game.cost, description=f"Game pass: {game.name}", timestamp=now()))
    db.commit()
    db.refresh(session)
    db.refresh(wallet)
    return ok({"pending": False, "session": session_dict(session), "newBalance": wallet.balance}, 201)


@router.post("/api/games/sessions/{session_id}/approve")
def approve_game_session(session_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    session = db.query(DBGameSession).filter(DBGameSession.id == session_id).first()
    if not session: fail("Game pass request not found", 404)
    kid = db.query(DBUser).filter(DBUser.id == session.kid_id).first()
    if not kid or kid.guardian_id != get_family_id(user): fail("Not allowed to modify this request", 403)
    if session.status != "pending": fail("Only pending game pass requests can be approved")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == session.kid_id).first()
    if not wallet or wallet.balance < session.cost:
        fail(f"{kid.name} no longer has enough points for this (needs {session.cost}, has {wallet.balance if wallet else 0}).")

    wallet.balance -= session.cost
    db.add(DBTransaction(id=str(uuid4()), kid_id=session.kid_id, type="spent",
                         amount=session.cost, description=f"Game pass: {session.game_name}", timestamp=now()))
    session.status = "approved"
    session.resolved_at = now()
    db.commit()
    db.refresh(session)
    db.refresh(wallet)
    return ok({"session": session_dict(session), "newBalance": wallet.balance})


@router.post("/api/games/sessions/{session_id}/reject")
def reject_game_session(session_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    session = db.query(DBGameSession).filter(DBGameSession.id == session_id).first()
    if not session: fail("Game pass request not found", 404)
    kid = db.query(DBUser).filter(DBUser.id == session.kid_id).first()
    if not kid or kid.guardian_id != get_family_id(user): fail("Not allowed to modify this request", 403)
    if session.status != "pending": fail("Only pending game pass requests can be rejected")

    session.status = "rejected"
    session.resolved_at = now()
    db.commit()
    db.refresh(session)
    return ok({"session": session_dict(session)})


@router.post("/api/games/sessions/{session_id}/start")
def start_game_session(session_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    session = db.query(DBGameSession).filter(DBGameSession.id == session_id).first()
    if not session: fail("Game pass not found", 404)
    if session.kid_id != user.id: fail("Not your game pass", 403)
    if session.status != "approved": fail("This game pass isn't ready to play")

    start = datetime.now(timezone.utc)
    session.started_at = start.isoformat()
    session.expires_at = (start + timedelta(minutes=session.duration_minutes)).isoformat()
    session.status = "active"
    db.commit()
    db.refresh(session)
    return ok(session_dict(session))
