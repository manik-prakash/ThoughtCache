import numpy as np

from app.config import get_settings
from app.schemas import SimilarPair
from app.vectorstore import get_user_chunks


def compute_similar_pairs(user_id: str) -> list[SimilarPair]:
    settings = get_settings()
    raw = get_user_chunks(user_id)

    embeddings = raw.get("embeddings") or []
    metadatas = raw.get("metadatas") or []
    if len(embeddings) == 0:
        return []

    item_vectors: dict[str, list] = {}
    for embedding, meta in zip(embeddings, metadatas):
        item_vectors.setdefault(meta["item_id"], []).append(embedding)

    item_ids = list(item_vectors.keys())
    if len(item_ids) < 2:
        return []

    matrix = np.array([np.mean(item_vectors[item_id], axis=0) for item_id in item_ids])
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1e-9
    normalized = matrix / norms
    similarity = normalized @ normalized.T

    neighbors: dict[str, list[tuple[str, float]]] = {item_id: [] for item_id in item_ids}
    for i in range(len(item_ids)):
        for j in range(i + 1, len(item_ids)):
            score = float(similarity[i][j])
            if score >= settings.GRAPH_SIMILARITY_THRESHOLD:
                neighbors[item_ids[i]].append((item_ids[j], score))
                neighbors[item_ids[j]].append((item_ids[i], score))

    seen_pairs: set[frozenset] = set()
    pairs: list[SimilarPair] = []
    for item_id in item_ids:
        top = sorted(neighbors[item_id], key=lambda pair: pair[1], reverse=True)[
            : settings.GRAPH_MAX_NEIGHBORS
        ]
        for other_id, score in top:
            key = frozenset((item_id, other_id))
            if key in seen_pairs:
                continue
            seen_pairs.add(key)
            pairs.append(SimilarPair(item_id_a=item_id, item_id_b=other_id, score=round(score, 4)))

    return pairs
