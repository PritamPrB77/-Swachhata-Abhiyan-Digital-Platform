from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://swachh:swachh@localhost:5432/complaint_db"
    jwt_secret: str = "swachhata-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minio"
    minio_secret_key: str = "minio12345"
    minio_bucket: str = "complaints"
    minio_secure: bool = False
    public_media_base: str = "/media"

    class Config:
        env_file = ".env"


settings = Settings()
