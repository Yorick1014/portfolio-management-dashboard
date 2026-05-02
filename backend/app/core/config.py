from functools import lru_cache
from secrets import token_urlsafe

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Portfolio Management Dashboard"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://portfolio:portfolio@db:5432/portfolio"
    jwt_secret_key: str = Field(default_factory=lambda: token_urlsafe(32))
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
