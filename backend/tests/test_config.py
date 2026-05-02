from app.core.config import Settings


def test_default_jwt_secret_is_generated_not_committed(monkeypatch) -> None:
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)

    settings = Settings()

    assert settings.jwt_secret_key != "change-me-in-production"
    assert len(settings.jwt_secret_key) >= 32
