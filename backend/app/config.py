from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "rad_educational_app_secret_key_2024_very_secure"
    DATABASE_URL: str = "postgresql+asyncpg://rad:rad_secret_2024@postgres:5432/rad"
    REDIS_URL: str = "redis://redis:6379/0"
    MINIO_URL: str = "http://minio:9000"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    class Config:
        env_file = ".env"


settings = Settings()
