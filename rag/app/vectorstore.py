from functools import lru_cache

import chromadb

from app.config import get_settings


@lru_cache(maxsize=1)
def _get_client() -> "chromadb.ClientAPI":
    settings = get_settings()
    return chromadb.CloudClient(
        tenant=settings.CHROMA_TENANT,
        database=settings.CHROMA_DATABASE,
        api_key=settings.CHROMA_API_KEY,
    )


@lru_cache(maxsize=1)
def _get_collection():
    settings = get_settings()
    client = _get_client()
    return client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def upsert_chunks(
    item_id: str,
    user_id: str,
    title: str,
    chunks: list[str],
    embeddings: list[list[float]],
) -> None:
    if not chunks:
        return
    ids = [f"{item_id}::{i}" for i in range(len(chunks))]
    metadatas = [
        {"user_id": user_id, "item_id": item_id, "title": title, "chunk_index": i}
        for i in range(len(chunks))
    ]
    _get_collection().upsert(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )


def delete_item_chunks(item_id: str) -> None:
    _get_collection().delete(where={"item_id": item_id})


def query_similar(user_id: str, query_embedding: list[float], top_k: int) -> dict:
    # Every read MUST filter by user_id — this is the single point in the
    # codebase that talks to Chroma for retrieval, so it is the one place
    # that needs auditing for cross-user data isolation.
    return _get_collection().query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_id": user_id},
        include=["documents", "metadatas", "distances"],
    )
