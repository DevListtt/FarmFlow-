"""
Configuration globale pour FarmFlow
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, RedisDsn
from typing import Optional, List


class Settings(BaseSettings):
    # Environnement
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Base de données PostgreSQL
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", 5432))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "farmflow")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "farmflow")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "farmflow")
    DATABASE_URL: PostgresDsn = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    
    # InfluxDB (Time-series pour IoT et métriques)
    INFLUXDB_HOST: str = os.getenv("INFLUXDB_HOST", "localhost")
    INFLUXDB_PORT: int = int(os.getenv("INFLUXDB_PORT", 8086))
    INFLUXDB_USER: str = os.getenv("INFLUXDB_USER", "farmflow")
    INFLUXDB_PASSWORD: str = os.getenv("INFLUXDB_PASSWORD", "farmflow")
    INFLUXDB_DB: str = os.getenv("INFLUXDB_DB", "farmflow_metrics")
    
    # Redis (Cache et sessions)
    REDIS_URL: RedisDsn = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # JWT (Authentification)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "farmflow-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # MQTT (IoT)
    MQTT_BROKER: str = os.getenv("MQTT_BROKER", "localhost")
    MQTT_PORT: int = int(os.getenv("MQTT_PORT", 1883))
    MQTT_USER: Optional[str] = os.getenv("MQTT_USER")
    MQTT_PASSWORD: Optional[str] = os.getenv("MQTT_PASSWORD")
    
    # Communication
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")
    SENDGRID_API_KEY: Optional[str] = os.getenv("SENDGRID_API_KEY")
    SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "noreply@farmflow.com")
    WHATSAPP_API_KEY: Optional[str] = os.getenv("WHATSAPP_API_KEY")
    WHATSAPP_PHONE_ID: Optional[str] = os.getenv("WHATSAPP_PHONE_ID")
    
    # API Externes
    WEATHER_API_KEY: Optional[str] = os.getenv("WEATHER_API_KEY")
    ZAPIER_WEBHOOK_URL: Optional[str] = os.getenv("ZAPIER_WEBHOOK_URL")
    
    # Stockage de fichiers
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/app/uploads")
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
