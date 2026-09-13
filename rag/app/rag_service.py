from app.config import get_settings
from app.embeddings import embed_query, embed_texts
from app.ingest.chunk_text import chunk_text
from app.llm import NO_CONTEXT_MESSAGE, build_prompt, generate_answer
from app.schemas import QueryResponse, QuerySource
from app.vectorstore import delete_item_chunks, query_similar, upsert_chunks


def ingest_item(item_id: str, user_id: str, title: str, content: str) -> int:
    """Chunk, embed, and (re)index one item. Idempotent: safe to call
    repeatedly for the same item (e.g. on every create/update)."""
    settings = get_settings()

    # Clear any existing chunks first so an edit that shrinks the item never
    # leaves orphaned chunks behind from a longer previous version.
    delete_item_chunks(item_id)

    full_text = f"{title}\n\n{content}".strip()
    chunks = chunk_text(full_text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
    if not chunks:
        return 0

    embeddings = embed_texts(chunks)
    upsert_chunks(item_id, user_id, title, chunks, embeddings)
    return len(chunks)


def answer_question(user_id: str, question: str) -> QueryResponse:
    settings = get_settings()

    query_embedding = embed_query(question)
    raw = query_similar(user_id, query_embedding, settings.RAG_TOP_K)

    docs = raw["documents"][0]
    metadatas = raw["metadatas"][0]

    if not docs:
        return QueryResponse(answer=NO_CONTEXT_MESSAGE, sources=[], has_context=False)

    context_blocks: list[tuple[int, str, str]] = []
    sources: dict[str, QuerySource] = {}
    distances = raw["distances"][0]
    for doc, meta, dist in zip(docs, metadatas, distances):
        index = len(context_blocks) + 1
        context_blocks.append((index, meta["title"], doc))
        item_id = meta["item_id"]
        if item_id not in sources:
            sources[item_id] = QuerySource(
                item_id=item_id,
                title=meta["title"],
                chunk_index=meta["chunk_index"],
                snippet=doc[:240],
                score=round(max(0.0, 1 - dist / 2), 4),
            )

    prompt = build_prompt(question, context_blocks)
    answer_text = generate_answer(prompt)

    return QueryResponse(answer=answer_text, sources=list(sources.values()), has_context=True)
