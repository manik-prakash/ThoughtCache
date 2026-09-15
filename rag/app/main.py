from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from app.embeddings import get_model
from app.graph import compute_similar_pairs
from app.rag_service import answer_question, ingest_item
from app.schemas import (
    IngestPayload,
    IngestResponse,
    QueryPayload,
    QueryResponse,
    SimilarItemsResponse,
)
from app.vectorstore import delete_item_chunks


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_model()  # warm the embedding model once at startup, not on first request
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}


# Handlers are deliberately plain `def`, not `async def`: sentence-transformers,
# the Chroma client, and the Gemini SDK are all synchronous/blocking calls.
# FastAPI runs sync `def` path operations in a threadpool automatically, which
# keeps the event loop free without extra boilerplate.

@app.post("/ingest", response_model=IngestResponse)
def ingest(payload: IngestPayload):
    try:
        count = ingest_item(payload.item_id, payload.user_id, payload.title, payload.content)
        return IngestResponse(success=True, chunks_indexed=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/items/{item_id}")
def delete_item(item_id: str):
    try:
        delete_item_chunks(item_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query", response_model=QueryResponse)
def query(payload: QueryPayload):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    try:
        return answer_question(payload.user_id, payload.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/graph/similar-items", response_model=SimilarItemsResponse)
def graph_similar_items(user_id: str):
    try:
        pairs = compute_similar_pairs(user_id)
        return SimilarItemsResponse(pairs=pairs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
