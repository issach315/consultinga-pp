from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Consulting API"
    app_env: str = "development"
    debug: bool = True

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    redis_url: str = "redis://localhost:6379/0"

    minio_endpoint: str = "http://localhost:9000"
    # Server-side S3 calls use minio_endpoint (a Docker-network hostname in
    # dev, e.g. "minio"). Presigned URLs are handed to the browser, which
    # can't resolve that hostname, so they're signed against this
    # browser-reachable one instead.
    minio_public_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadminpassword"
    minio_bucket: str = "consulting-files"
    minio_region: str = "us-east-1"
    minio_secure: bool = False

    mail_host: str = "localhost"
    mail_port: int = 1025
    mail_username: str = ""
    mail_password: str = ""
    # MAIL_FROM/MAIL_FROM_NAME are the "from" address + display name every
    # outbound email (including both invitation templates) is sent as.
    mail_from: str = "noreply@consulting.local"
    mail_from_name: str = "Consulting SaaS"
    mail_use_tls: bool = False
    mail_start_tls: bool = False

    # Fallback "contact us" address shown in email footers when a tenant
    # hasn't configured its own branding.support_email.
    support_email: str = ""

    cors_origins: str = "http://localhost:5173"

    invitation_expiry_days: int = 7

    # Subdomain-based tenant routing: app_base_domain is the bare domain
    # tenant subdomains hang off (no scheme/port) — used to strip a
    # subdomain off an inbound Host header. frontend_scheme/base_domain are
    # used the other way, to build outbound links (e.g. invite emails).
    app_base_domain: str = "localhost"
    frontend_scheme: str = "http"
    frontend_base_domain: str = "localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def app_frontend_url(self) -> str:
        """Base frontend origin with no tenant subdomain, e.g. "http://localhost:5173".
        Per-tenant invitation links use build_frontend_url() instead, which
        prefixes the tenant's subdomain onto frontend_base_domain — this is
        the app-wide fallback for contexts that aren't tenant-specific."""
        return f"{self.frontend_scheme}://{self.frontend_base_domain}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
