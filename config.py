from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    database_url: str = "sqlite+aiosqlite:///db.sqlite"
    api_key: str

    class Config:
        env_file = ".env"

settings = Settings()
