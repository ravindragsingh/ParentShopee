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
engine = create_engine(_DB_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
