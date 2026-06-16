import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # API & Security
    OPENAI_API_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Paths and Storage (can be relative to project root or absolute)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    NEGOTIATIONS_DIR: Path = BASE_DIR / "negotiations"
    VECTORSTORES_DIR: Path = BASE_DIR / "vectorstores"
    DATABASE_DIR: Path = BASE_DIR / "database"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"sqlite+aiosqlite:///{self.DATABASE_DIR}/app.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
def init_directories():
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    (settings.DATA_DIR / "companies").mkdir(parents=True, exist_ok=True)
    settings.NEGOTIATIONS_DIR.mkdir(parents=True, exist_ok=True)
    settings.VECTORSTORES_DIR.mkdir(parents=True, exist_ok=True)
    settings.DATABASE_DIR.mkdir(parents=True, exist_ok=True)
