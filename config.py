from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    openai_api_key: str = ""
    xai_api_key: str = ""
    google_api_key: str = ""
    hf_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///db.sqlite"
    api_key: str = "default_key"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
