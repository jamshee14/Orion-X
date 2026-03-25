from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_hostname: str
    database_port: str
    database_user: str
    database_password: str
    database_name: str
    secret_key: str
    algorithm: str
    access_token_expire: int
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    gemini_api_key: str

    class Config:
        env_file = ".env"

settings = Settings()
