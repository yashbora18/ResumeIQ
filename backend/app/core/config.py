from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "ResumeIQ API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str

    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    GEMINI_API_KEY: str

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = ""

    ENABLE_API_DOCS: bool = True
    ENABLE_SECURITY_HEADERS: bool = True
    MAX_REQUEST_BODY_SIZE_MB: int = 7
    ALLOWED_HOSTS: str = "127.0.0.1,localhost"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        origins = []

        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL.strip().rstrip("/"))

        for origin in self.CORS_ORIGINS.split(","):
            origin = origin.strip().rstrip("/")
            if origin:
                origins.append(origin)

        return list(dict.fromkeys(origins))

    @property
    def allowed_hosts(self) -> list[str]:
        hosts = []

        for host in self.ALLOWED_HOSTS.split(","):
            host = host.strip()

            if host:
                hosts.append(host)

        return list(dict.fromkeys(hosts))

    @property
    def max_request_body_size_bytes(self) -> int:
        return self.MAX_REQUEST_BODY_SIZE_MB * 1024 * 1024


settings = Settings()
