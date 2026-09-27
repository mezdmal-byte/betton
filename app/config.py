from pydantic_settings import BaseSettings, SettingsConfigDict

ADMIN_BANKROLL = 1_000_000.0
TIP_CREATOR_SHARE = 0.75
TIP_PLATFORM_SHARE = 0.25


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./betton.db"
    bot_token: str = ""
    telegram_bot_username: str = ""
    mini_app_url: str = ""
    public_base_url: str = ""
    render_external_url: str = ""
    tip_cap: float = 0.01
    starting_balance: float = 1000.0
    admin_telegram_id: str | int | None = None
    admin_telegram_usernames: str = ""
    betton_preview_seed: bool = False
    telegram_auth_proxy_url: str = ""
    telegram_webhook_proxy_url: str = ""
    preview_root_to_v2: bool = False
    pandascore_token: str = ""

    def admin_tg_id(self) -> int | None:
        raw = self.admin_telegram_id
        if raw is None:
            return None
        text = str(raw).strip()
        if not text:
            return None
        try:
            return int(text)
        except ValueError:
            return None

    def is_admin_telegram(self, telegram_id: int | None) -> bool:
        admin_id = self.admin_tg_id()
        return admin_id is not None and telegram_id is not None and int(telegram_id) == admin_id

    def admin_tg_usernames(self) -> frozenset[str]:
        raw = str(self.admin_telegram_usernames or "")
        return frozenset(
            part.strip().lstrip("@").lower()
            for part in raw.replace(";", ",").split(",")
            if part.strip().lstrip("@")
        )

    def is_admin_telegram_username(self, username: str | None) -> bool:
        if not isinstance(username, str):
            return False
        normalized = username.strip().lstrip("@").lower()
        return bool(normalized) and normalized in self.admin_tg_usernames()

    def is_admin_telegram_identity(self, telegram_id: int | None, username: str | None) -> bool:
        return self.is_admin_telegram(telegram_id) or self.is_admin_telegram_username(username)

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
