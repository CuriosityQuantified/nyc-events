"""Application configuration via environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings loaded from environment variables."""

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nyc_events"
    redis_url: str = "redis://localhost:6379/0"
    environment: str = "development"

    model_config = {"env_prefix": "", "case_sensitive": False}


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
