import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base

_DB_URL = os.environ.get("DATABASE_URL", "sqlite:///./parentshopee.db")
# Normalise URL: Render gives postgres://, psycopg3 dialect needs postgresql+psycopg://
if _DB_URL.startswith("postgres://"):
    _DB_URL = _DB_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif _DB_URL.startswith("postgresql://"):
    _DB_URL = _DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)

_connect_args = {"check_same_thread": False} if _DB_URL.startswith("sqlite") else {}
# Defaults (pool_size=5, max_overflow=10 -> 15 connections, pool_timeout=30s)
# meant that once ~15 requests were in flight at once, every request past that
# queued for a free connection and only failed after a 30s hang. Widened the
# pool so more requests can actually run concurrently, and shortened the
# timeout so once it IS exhausted, requests fail fast instead of hanging.
# 20 + 20 = 40 connections assumes this is the only process talking to the DB
# (single Render web service instance) — check the Postgres plan's own
# max_connections before raising this further or adding more instances/workers.
engine = create_engine(
    _DB_URL,
    connect_args=_connect_args,
    pool_size=20,
    max_overflow=20,
    pool_timeout=10,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
