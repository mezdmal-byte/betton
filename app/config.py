from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

ADMIN_BANKROLL = 1_000_000.0
TIP_CREATOR_SHARE = 0.75
TIP_PLATFORM_SHARE = 0.25


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./betton.db"
    bot_token: str = Field(default="", repr=False)
    telegram_webhook_secret: str = Field(default="", repr=False)
    telegram_webhook_previous_secret: str = Field(default="", repr=False)
    telegram_webhook_proxy_secret: str = Field(default="", repr=False)
    telegram_bot_username: str = ""
    mini_app_url: str = ""
    public_base_url: str = ""
    render_external_url: str = ""
    tip_cap: float = 0.01
    starting_balance: float = 1000.0
    allow_unkeyed_legacy_buy: bool = False
    admin_telegram_id: str | int | None = None
    admin_telegram_usernames: str = ""  # Deprecated: never grants permissions.
    admin_telegram_ids: str = ""
    admin_telegram_revoked_ids: str = ""
    betton_preview_seed: bool = False
    telegram_auth_proxy_url: str = ""
    telegram_webhook_proxy_url: str = ""
    preview_root_to_v2: bool = False
    guarantor_minimum_profit_bps: int = Field(default=2000, ge=0, le=9900)
    betton_environment: str = "production"
    betton_demo_automation: bool = False
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

    def admin_ids(self) -> frozenset[int]:
        raw = str(self.admin_telegram_ids or "")
        parts = [part.strip() for part in raw.replace(";", ",").split(",") if part.strip()]
        if self.admin_telegram_id is not None and str(self.admin_telegram_id).strip():
            parts.append(str(self.admin_telegram_id).strip())
        revoked = [part.strip() for part in self.admin_telegram_revoked_ids.replace(";", ",").split(",") if part.strip()]
        if any(not part.isascii() or not part.isdecimal() or int(part) <= 0 for part in parts + revoked):
            return frozenset()
        return frozenset(map(int, parts)) - frozenset(map(int, revoked))

    def validate_admin_configuration(self) -> None:
        if self.admin_telegram_usernames.strip():
            raise RuntimeError("Replace deprecated admin usernames with independently verified Telegram IDs before deployment")
        raw_ids = [str(self.admin_telegram_id or ""), self.admin_telegram_ids, self.admin_telegram_revoked_ids]
        parts = [p.strip() for raw in raw_ids for p in raw.replace(";", ",").split(",") if p.strip()]
        if any(not p.isascii() or not p.isdecimal() or int(p) <= 0 for p in parts):
            raise RuntimeError("Invalid administrator ID configuration")

    def is_admin_telegram(self, telegram_id: int | None) -> bool:
        return telegram_id is not None and telegram_id in self.admin_ids()

    def is_admin_telegram_identity(self, telegram_id: int | None, username: str | None) -> bool:
        return self.is_admin_telegram(telegram_id)

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
