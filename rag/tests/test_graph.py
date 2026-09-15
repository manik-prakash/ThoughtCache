from app import graph as graph_module


class FakeSettings:
    GRAPH_SIMILARITY_THRESHOLD = 0.5
    GRAPH_MAX_NEIGHBORS = 3


def test_links_similar_items_above_threshold(monkeypatch):
    monkeypatch.setattr(graph_module, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr(
        graph_module,
        "get_user_chunks",
        lambda user_id: {
            "embeddings": [[1.0, 0.0], [1.0, 0.0], [0.0, 1.0]],
            "metadatas": [
                {"item_id": "a"},
                {"item_id": "b"},
                {"item_id": "c"},
            ],
        },
    )

    pairs = graph_module.compute_similar_pairs("user-1")
    pair_keys = {frozenset((p.item_id_a, p.item_id_b)) for p in pairs}

    assert frozenset(("a", "b")) in pair_keys
    assert frozenset(("a", "c")) not in pair_keys
    assert frozenset(("b", "c")) not in pair_keys


def test_mean_pools_multiple_chunks_per_item(monkeypatch):
    monkeypatch.setattr(graph_module, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr(
        graph_module,
        "get_user_chunks",
        lambda user_id: {
            # item "a" has two chunks that average out close to item "b"'s single chunk
            "embeddings": [[1.0, 0.2], [0.8, 0.0], [0.9, 0.1]],
            "metadatas": [
                {"item_id": "a"},
                {"item_id": "a"},
                {"item_id": "b"},
            ],
        },
    )

    pairs = graph_module.compute_similar_pairs("user-1")
    pair_keys = {frozenset((p.item_id_a, p.item_id_b)) for p in pairs}

    assert frozenset(("a", "b")) in pair_keys


def test_empty_for_single_item(monkeypatch):
    monkeypatch.setattr(graph_module, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr(
        graph_module,
        "get_user_chunks",
        lambda user_id: {"embeddings": [[1.0, 0.0]], "metadatas": [{"item_id": "a"}]},
    )

    assert graph_module.compute_similar_pairs("user-1") == []


def test_empty_when_no_chunks(monkeypatch):
    monkeypatch.setattr(graph_module, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr(
        graph_module, "get_user_chunks", lambda user_id: {"embeddings": [], "metadatas": []}
    )

    assert graph_module.compute_similar_pairs("user-1") == []
