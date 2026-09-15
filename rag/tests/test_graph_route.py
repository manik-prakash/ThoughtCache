from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app
from app.schemas import SimilarPair


def test_graph_similar_items_route(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "compute_similar_pairs",
        lambda user_id: [SimilarPair(item_id_a="a", item_id_b="b", score=0.9)],
    )
    # Not used as a context manager on purpose: this keeps the lifespan
    # startup hook (which warms the embedding model) from running for a
    # route-shape test that doesn't need it.
    client = TestClient(app)

    response = client.get("/graph/similar-items", params={"user_id": "user-1"})

    assert response.status_code == 200
    assert response.json() == {"pairs": [{"item_id_a": "a", "item_id_b": "b", "score": 0.9}]}
