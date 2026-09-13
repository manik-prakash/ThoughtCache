from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PORT: int = 8000

    CHROMA_API_KEY: str
    CHROMA_TENANT: str
    CHROMA_DATABASE: str
    CHROMA_COLLECTION_NAME: str = "thoughtcache_items"

    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150
    RAG_TOP_K: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
