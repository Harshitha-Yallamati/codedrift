from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "CodeDrift"
    ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+psycopg2://codedrift:codedrift@localhost:5432/codedrift"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "dev-secret-key-change-me"
    FERNET_KEY: str = "3TAJqz1neYnjSHXAaCqx0IhufC3T2QbdmwGMSD9sPjE="
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/github/callback"
    GITHUB_WEBHOOK_SECRET: str = "dev-webhook-secret"
    GITHUB_API_BASE: str = "https://api.github.com"

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    MIN_TRAINING_SAMPLES: int = 30

    @property
    def cors_origins(self) -> List[str]:
        origins = list(self.CORS_ORIGINS)
        if self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
