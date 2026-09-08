from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./betton.db"
    bot_token: str = ""
    mini_app_url: str = ""
    public_base_url: str = ""
    render_external_url: str = ""
    tip_cap: float = 0.01
    starting_balance: float = 1000.0

    def webapp_base(self) -> str:
        """Публичный адрес бэкенда (Mini App + webhook)."""
        candidates = (
            self.public_base_url,
            self.mini_app_url,
            self.render_external_url,
        )
        for raw in candidates:
            url = (raw or "").strip().rstrip("/")
            if not url:
                continue
            if url in {"https://onrender.com", "http://onrender.com"}:
                continue
            return url
        return "https://betton-630y.onrender.com"

    def is_public_https(self) -> bool:
        url = self.webapp_base()
        return (
            url.startswith("https://")
            and "127.0.0.1" not in url
            and "localhost" not in url
        )


settings = Settings()
