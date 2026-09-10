from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./control_plane.db"
    max_sync_attempts: int = 3
    worker_poll_seconds: int = 5
    default_batch_size: int = 1000

    model_config = SettingsConfigDict(env_prefix="DATAPLATFORM_", env_file=".env")


settings = Settings()
