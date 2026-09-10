"""Database configuration shared by the API and the local launcher."""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{(ROOT / 'quiz.db').as_posix()}")
IS_SQLITE = DATABASE_URL.startswith("sqlite")
engine = create_engine(DATABASE_URL, pool_pre_ping=True,
    connect_args={"check_same_thread": False} if IS_SQLITE else {"connect_timeout": 5})
if IS_SQLITE:
    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()

def get_db():
    with SessionLocal() as db:
        yield db
