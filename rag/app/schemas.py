from pydantic import BaseModel


class IngestPayload(BaseModel):
    item_id: str
    user_id: str
    title: str
    content: str


class IngestResponse(BaseModel):
    success: bool
    chunks_indexed: int


class QueryPayload(BaseModel):
    user_id: str
    question: str


class QuerySource(BaseModel):
    item_id: str
    title: str
    chunk_index: int
    snippet: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[QuerySource]
    has_context: bool
