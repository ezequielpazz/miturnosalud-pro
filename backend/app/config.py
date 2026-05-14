from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "MiTurno Salud PRO"
    APP_VERSION: str = "2.0.0"

    # Database - SQLite for dev, PostgreSQL for production
    # PostgreSQL: "postgresql://user:pass@localhost:5432/miturnosalud"
    DATABASE_URL: str = "sqlite:///./miturnosalud.db"

    # JWT
    SECRET_KEY: str = "miturnosalud-secret-key-cambiar-en-produccion-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 horas

    # Seed
    SEED_DATA: bool = True  # Poner False en producción

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
