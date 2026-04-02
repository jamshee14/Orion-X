from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_hostname: str
    database_port: str
    database_user: str
    database_password: str
    database_name: str
    database_url: Optional[str] = None
    secret_key: str
    algorithm: str
    access_token_expire: int
    gemini_api_key: str
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
