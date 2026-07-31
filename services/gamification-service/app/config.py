from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://swachh:swachh@localhost:5432/gamification_db"
    jwt_secret: str = "swachhata-dev-secret-change-me"
    jwt_algorithm: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
