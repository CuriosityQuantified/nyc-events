"""Concierge-specific environment configuration."""

from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class ConciergeSettings(BaseSettings):
    """Settings that are required only when the concierge is enabled."""

    openrouter_api_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "OPENROUTER_API_KEY",
            "OPEN_ROUTER_API_KEY",
        ),
    )
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    concierge_model_primary: str = "deepseek/deepseek-v4-flash-0731"
    concierge_model_fallback: str = "nvidia/nemotron-3.5-lightning:free"
    concierge_max_input_chars: int = 2000

    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
        env_file=_REPOSITORY_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_concierge_settings() -> ConciergeSettings:
    return ConciergeSettings()
