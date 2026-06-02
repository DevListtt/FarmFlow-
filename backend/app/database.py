"""
Configuration de la base de données PostgreSQL
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .core.config import settings

# Convertir PostgresDsn en string pour SQLAlchemy
DATABASE_URL_STR = str(settings.DATABASE_URL)

# Créer l'engin SQLAlchemy
engine = create_engine(
    DATABASE_URL_STR,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Créer la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()


def get_db():
    """
    Générateur pour obtenir une session de base de données
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialiser la base de données (créer les tables)
    """
    Base.metadata.create_all(bind=engine)
    print("Base de données initialisée avec succès")


# Pour Alembic
TargetMetadata = Base.metadata
