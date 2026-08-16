"""Application configuration via environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings loaded from environment variables."""

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/nyc_events"
    )
    redis_url: str = "redis://localhost:6379/0"
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    snapshot_stale_after_seconds: int = 21600
    sync_lock_timeout_seconds: int = 10800

    socrata_api_key_id: str = ""
    socrata_api_key_secret: str = ""
    socrata_app_token: str = ""
    socrata_dataset_id: str = "w3wp-dpdi"
    socrata_query_endpoint: str = (
        "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
    )

    model_config = {"env_prefix": "", "case_sensitive": False}


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
