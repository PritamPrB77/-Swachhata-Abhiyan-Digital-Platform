from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://swachh:swachh@localhost:5432/auth_db"
    jwt_secret: str = "swachhata-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    cors_origins: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()
