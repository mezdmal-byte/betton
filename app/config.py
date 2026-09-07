from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./betton.db"
    bot_token: str = ""
    mini_app_url: str = "http://127.0.0.1:8000"
    tip_cap: float = 0.01
    starting_balance: float = 1000.0


settings = Settings()
