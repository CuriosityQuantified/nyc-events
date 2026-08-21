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
    # OpenRouter models are tried in declaration order. Keep DeepSeek last as
    # the final fallback after the free model pool is exhausted.
    concierge_model_primary: str = "nvidia/nemotron-3.5-lightning:free"
    concierge_model_fallback: str = "nvidia/nemotron-3-super-120b-a12b:free"
    concierge_model_fallback_2: str = "dots-studio/dots-3-note-preview:free"
    concierge_model_fallback_3: str = "poolside/laguna-xs-2.1:free"
    concierge_model_fallback_4: str = "deepseek/deepseek-v4-flash-0731"
    concierge_max_input_chars: int = 2000

    @property
    def model_chain(self) -> tuple[str, ...]:
        """Return the primary model followed by ordered fallback models."""
        return (
            self.concierge_model_primary,
            self.concierge_model_fallback,
            self.concierge_model_fallback_2,
            self.concierge_model_fallback_3,
            self.concierge_model_fallback_4,
        )

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
