"""
Configuration PostgreSQL.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .core.config import settings


DATABASE_URL_STR = str(settings.DATABASE_URL)

engine = create_engine(
    DATABASE_URL_STR,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Retourner une session SQLAlchemy par requete."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creer les tables connues par SQLAlchemy."""
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    print("Base de donnees initialisee avec succes")


TargetMetadata = Base.metadata
