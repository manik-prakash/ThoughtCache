# Item Graph Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/graph` page that renders the user's items as a force-directed node graph, connecting items that share a tag and/or are semantically similar (via the existing RAG embeddings).

**Architecture:** Two edge sources are computed independently and merged by a new Node endpoint: tag-edges from MongoDB (existing `Item`/`ItemTag`/`Tag` collections), semantic-edges from a new `rag/` endpoint that reuses the embeddings already stored in Chroma for RAG. The frontend renders the merged graph with `react-force-graph-2d`.

**Tech Stack:** FastAPI + numpy (rag/), Express + Mongoose (backend/), React 19 + `react-force-graph-2d` (frontend/).

**Spec:** `docs/superpowers/specs/2026-09-15-item-graph-visualization-design.md`

## Global Constraints

- Semantic-similarity default threshold: cosine similarity ≥ `0.55` (config `GRAPH_SIMILARITY_THRESHOLD`).
- Cap each item to its top `3` semantic neighbors (config `GRAPH_MAX_NEIGHBORS`) to prevent a dense hairball.
- If a pair of items has both a shared tag AND a semantic match, the merged edge's `kind` is `'tag'` (more explainable to the user), but its similarity `score` is still attached for the tooltip.
- The rag service call from the Node backend is **best-effort**: any failure (timeout, non-2xx, `RAG_SERVICE_URL` unset) must resolve to `[]`, never throw — the graph must always render with at least tag-edges.
- Cross-user isolation: the Node controller must filter any semantic pairs to item ids that belong to the requesting user's own item set, even though the rag service already scopes by `user_id` via Chroma's `where` filter (defense in depth).
- **Test tooling note:** `rag/` has no existing test setup — this plan adds `pytest` + `httpx` (for FastAPI's `TestClient`) as it's cheap and the similarity math is pure logic worth unit-testing. `backend/` and `frontend/` have **zero existing automated tests** for any controller or page (confirmed: `backend/package.json`'s `test` script is a stub, no Jest/Vitest/RTL anywhere in the repo). Introducing a whole new JS test framework for one feature would be out-of-scope, unrelated-scope work, so those two tasks use concrete manual verification steps (`curl`, then the browser) instead of automated tests — this matches how every existing backend controller and frontend page in this codebase is already verified, not a shortcut.

---

### Task 1: rag/ — semantic similarity endpoint

**Files:**
- Create: `rag/app/graph.py`
- Create: `rag/tests/test_graph.py`
- Create: `rag/tests/test_graph_route.py`
- Create: `rag/pytest.ini`
- Modify: `rag/app/vectorstore.py` — add `get_user_chunks`
- Modify: `rag/app/config.py` — add `GRAPH_SIMILARITY_THRESHOLD`, `GRAPH_MAX_NEIGHBORS`
- Modify: `rag/app/schemas.py` — add `SimilarPair`, `SimilarItemsResponse`
- Modify: `rag/app/main.py` — add `GET /graph/similar-items`
- Modify: `rag/requirements.txt` — add `numpy`, `pytest`, `httpx`

**Interfaces:**
- Produces: `compute_similar_pairs(user_id: str) -> list[SimilarPair]` in `app/graph.py`, used by the new route.
- Produces: `GET /graph/similar-items?user_id=<id>` → `{"pairs": [{"item_id_a": str, "item_id_b": str, "score": float}]}`, called by the Node backend in Task 2.
- Produces: `get_user_chunks(user_id: str) -> dict` in `app/vectorstore.py`, returning the raw Chroma `.get()` result (`{"embeddings": [...], "metadatas": [...]}`) for that user — the single new Chroma read point this task adds.

- [ ] **Step 1: Add pytest config so `app` imports resolve in tests**

Create `rag/pytest.ini`:

```ini
[pytest]
pythonpath = .
```

- [ ] **Step 2: Add test/runtime dependencies**

Append to `rag/requirements.txt`:

```
numpy==2.2.1
pytest==8.3.4
httpx==0.28.1
```

Run: `cd rag && ./venv/Scripts/python -m pip install -r requirements.txt` (Windows venv already exists at `rag/venv`)

- [ ] **Step 3: Write the failing unit tests for the similarity computation**

Create `rag/tests/test_graph.py`:

```python
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
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `cd rag && ./venv/Scripts/python -m pytest tests/test_graph.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.graph'` (or `AttributeError`, since `graph.py` doesn't exist yet).

- [ ] **Step 5: Add the new Chroma read function**

In `rag/app/vectorstore.py`, add below `query_similar`:

```python
def get_user_chunks(user_id: str) -> dict:
    # Second (and last) Chroma read point in this module, alongside
    # query_similar — also scoped by user_id for the same isolation reason.
    return _get_collection().get(
        where={"user_id": user_id},
        include=["embeddings", "metadatas"],
    )
```

- [ ] **Step 6: Add the two graph settings**

In `rag/app/config.py`, add inside the `Settings` class, after `RAG_TOP_K`:

```python
    GRAPH_SIMILARITY_THRESHOLD: float = 0.55
    GRAPH_MAX_NEIGHBORS: int = 3
```

- [ ] **Step 7: Add the SimilarPair/SimilarItemsResponse schemas**

In `rag/app/schemas.py`, add at the end:

```python
class SimilarPair(BaseModel):
    item_id_a: str
    item_id_b: str
    score: float


class SimilarItemsResponse(BaseModel):
    pairs: list[SimilarPair]
```

- [ ] **Step 8: Implement `compute_similar_pairs`**

Create `rag/app/graph.py`:

```python
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
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `cd rag && ./venv/Scripts/python -m pytest tests/test_graph.py -v`
Expected: PASS (4 passed)

- [ ] **Step 10: Write the failing route test**

Create `rag/tests/test_graph_route.py`:

```python
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
```

- [ ] **Step 11: Run it to verify it fails**

Run: `cd rag && ./venv/Scripts/python -m pytest tests/test_graph_route.py -v`
Expected: FAIL — 404 (route doesn't exist yet) or `AttributeError: module 'app.main' has no attribute 'compute_similar_pairs'`.

- [ ] **Step 12: Wire the route into main.py**

In `rag/app/main.py`, add to the imports:

```python
from app.graph import compute_similar_pairs
from app.schemas import (
    IngestPayload,
    IngestResponse,
    QueryPayload,
    QueryResponse,
    SimilarItemsResponse,
)
```

(this replaces the existing narrower `from app.schemas import (...)` block — add `SimilarItemsResponse` to it)

Then add the route, after the `/query` handler:

```python
@app.get("/graph/similar-items", response_model=SimilarItemsResponse)
def graph_similar_items(user_id: str):
    try:
        pairs = compute_similar_pairs(user_id)
        return SimilarItemsResponse(pairs=pairs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 13: Run all rag tests to verify they pass**

Run: `cd rag && ./venv/Scripts/python -m pytest -v`
Expected: all tests PASS (existing tests + the 5 new ones)

- [ ] **Step 14: Commit**

```bash
git add rag/app/graph.py rag/app/vectorstore.py rag/app/config.py rag/app/schemas.py rag/app/main.py rag/requirements.txt rag/pytest.ini rag/tests/test_graph.py rag/tests/test_graph_route.py
git commit -m "feat(rag): add item similarity endpoint for graph visualization"
```

---

### Task 2: backend/ — `/api/graph` endpoint

**Files:**
- Modify: `backend/src/utils/ragClient.ts` — add `getSimilarItemPairs`
- Create: `backend/src/controllers/graphController.ts`
- Create: `backend/src/routes/graphRoutes.ts`
- Modify: `backend/src/index.ts` — mount the new route

**Interfaces:**
- Consumes: `rag/`'s `GET /graph/similar-items?user_id=` from Task 1, returning `{"pairs": [{item_id_a, item_id_b, score}]}`.
- Consumes: `Item`, `ItemTag`, `Tag` Mongoose models (existing, in `backend/src/models/`) — same shape used by `itemController.ts`'s `listItems`.
- Produces: `GET /api/graph` (behind `authenticate`) → `{ nodes: GraphNode[], edges: GraphEdge[] }`, consumed by the frontend in Task 3:
  - `GraphNode = { id: string, title: string, type: string, is_starred: boolean, tags: {id,name,color}[] }`
  - `GraphEdge = { source: string, target: string, kind: 'tag' | 'semantic', shared_tags: {id,name,color}[], score?: number }`

- [ ] **Step 1: Add `getSimilarItemPairs` to ragClient.ts**

In `backend/src/utils/ragClient.ts`, add at the end:

```typescript
export interface SimilarItemPair {
  item_id_a: string;
  item_id_b: string;
  score: number;
}

export async function getSimilarItemPairs(userId: string): Promise<SimilarItemPair[]> {
  if (!RAG_SERVICE_URL) return [];
  try {
    const res = await ragFetch(
      `/graph/similar-items?user_id=${encodeURIComponent(userId)}`,
      { method: 'GET' },
      10000
    );
    if (!res.ok) {
      console.error(`[ragClient] similar-items failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.pairs ?? [];
  } catch (err) {
    console.error('[ragClient] similar-items error:', err);
    return [];
  }
}
```

This follows the same never-throw pattern as `ingestItem`/`deleteItemChunks` in this file — the graph must render even if the rag service is down.

- [ ] **Step 2: Write the graph controller**

Create `backend/src/controllers/graphController.ts`:

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Item } from '../models/Item';
import { ItemTag } from '../models/ItemTag';
import { Tag } from '../models/Tag';
import * as ragClient from '../utils/ragClient';
import mongoose from 'mongoose';

interface GraphTag {
  id: string;
  name: string;
  color: string | null;
}

interface GraphNode {
  id: string;
  title: string;
  type: string;
  is_starred: boolean;
  tags: GraphTag[];
}

interface GraphEdge {
  source: string;
  target: string;
  kind: 'tag' | 'semantic';
  shared_tags: GraphTag[];
  score?: number;
}

const pairKey = (a: string, b: string): string => (a < b ? `${a}::${b}` : `${b}::${a}`);

export const getGraph = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const items = await Item.find({ user_id: userId });
    const itemIds = items.map((item) => item._id);

    const itemTags = await ItemTag.find({ item_id: { $in: itemIds } });
    const tagIds = [...new Set(itemTags.map((it) => it.tag_id.toString()))];
    const tags = await Tag.find({ _id: { $in: tagIds } });
    const tagById = new Map(tags.map((tag) => [(tag._id as any).toString(), tag]));

    const tagsByItem = new Map<string, GraphTag[]>();
    const itemsByTag = new Map<string, string[]>();
    for (const it of itemTags) {
      const itemId = it.item_id.toString();
      const tagId = it.tag_id.toString();
      const tag = tagById.get(tagId);
      if (!tag) continue;

      const graphTag: GraphTag = { id: tagId, name: tag.name, color: tag.color };
      if (!tagsByItem.has(itemId)) tagsByItem.set(itemId, []);
      tagsByItem.get(itemId)!.push(graphTag);

      if (!itemsByTag.has(tagId)) itemsByTag.set(tagId, []);
      itemsByTag.get(tagId)!.push(itemId);
    }

    const nodes: GraphNode[] = items.map((item) => ({
      id: (item._id as any).toString(),
      title: item.title,
      type: item.type,
      is_starred: item.is_starred,
      tags: tagsByItem.get((item._id as any).toString()) || [],
    }));
    const itemIdSet = new Set(nodes.map((n) => n.id));

    const edgeByPair = new Map<string, GraphEdge>();

    for (const [tagId, memberIds] of itemsByTag) {
      const tag = tagById.get(tagId)!;
      const graphTag: GraphTag = { id: tagId, name: tag.name, color: tag.color };
      for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
          const key = pairKey(memberIds[i], memberIds[j]);
          let edge = edgeByPair.get(key);
          if (!edge) {
            edge = { source: memberIds[i], target: memberIds[j], kind: 'tag', shared_tags: [] };
            edgeByPair.set(key, edge);
          }
          edge.shared_tags.push(graphTag);
        }
      }
    }

    const similarPairs = await ragClient.getSimilarItemPairs(req.user!.id);
    for (const pair of similarPairs) {
      if (!itemIdSet.has(pair.item_id_a) || !itemIdSet.has(pair.item_id_b)) continue;
      const key = pairKey(pair.item_id_a, pair.item_id_b);
      const existing = edgeByPair.get(key);
      if (existing) {
        existing.score = pair.score;
      } else {
        edgeByPair.set(key, {
          source: pair.item_id_a,
          target: pair.item_id_b,
          kind: 'semantic',
          shared_tags: [],
          score: pair.score,
        });
      }
    }

    res.json({ nodes, edges: Array.from(edgeByPair.values()) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to build graph', message: error.message });
  }
};
```

- [ ] **Step 3: Add the route**

Create `backend/src/routes/graphRoutes.ts`:

```typescript
import { Router } from 'express';
import { getGraph } from '../controllers/graphController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getGraph);

export default router;
```

- [ ] **Step 4: Mount the route**

In `backend/src/index.ts`, add the import alongside the other route imports:

```typescript
import graphRoutes from './routes/graphRoutes';
```

And mount it alongside the other `app.use('/api/...)` lines:

```typescript
app.use('/api/graph', graphRoutes);
```

- [ ] **Step 5: Build and start the backend**

Run: `cd backend && npm run build && npm run start` (or `npm run dev:watch` during iteration)
Expected: no TypeScript errors, server logs `Server is running on port <PORT>`.

- [ ] **Step 6: Manually verify the endpoint**

With the backend running and at least one existing user account with a few items/tags (log in via the app UI, or via `curl` against `/api/auth/login` with that account's credentials to get a token):

```bash
curl -s -X POST http://localhost:$PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'
```

Copy the returned `token`, then:

```bash
curl -s http://localhost:$PORT/api/graph -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `{"nodes":[...],"edges":[...]}` — one node per existing item, with `edges` containing a `kind: "tag"` entry for any pair of items you know share a tag. If `RAG_SERVICE_URL` isn't set or the `rag` service isn't running, `edges` should still contain the tag-based entries (no error, no 5xx).

- [ ] **Step 7: Commit**

```bash
git add backend/src/utils/ragClient.ts backend/src/controllers/graphController.ts backend/src/routes/graphRoutes.ts backend/src/index.ts
git commit -m "feat(backend): add /api/graph endpoint merging tag and semantic edges"
```

---

### Task 3: frontend/ — Graph page

**Files:**
- Modify: `frontend/package.json` — add `react-force-graph-2d`
- Modify: `frontend/src/lib/types.ts` — add graph types
- Create: `frontend/src/pages/Graph.tsx`
- Modify: `frontend/src/App.tsx` — register `/graph` route
- Modify: `frontend/src/components/layout/Sidebar.tsx` — add sidebar entry
- Modify: `frontend/src/components/layout/AppShell.tsx` — add `getCurrentView` case

**Interfaces:**
- Consumes: `GET /api/graph` from Task 2, via `api.get<GraphResponse>('/graph')` (existing `httpClient`, which already prefixes `/api`).
- Consumes: existing `useToast`, `getErrorMessage`, `Card`, `Spinner` UI components (same imports as `Ask.tsx`/`Tags.tsx`).

> **Note on tag colors:** `Tag.color` is stored as a free-form string but is `null` for every tag created through the current UI (`Tags.tsx`'s create form never sets it), and `components/ui/Tag.tsx` treats a non-null `color` as a raw Tailwind class name (not a CSS color), which wouldn't be usable as a canvas fill/stroke color anyway. So this page does **not** rely on `tag.color` for node/edge coloring — it derives a stable color per tag id with a small hash function instead, guaranteeing every tag renders distinctly regardless of whether `color` is set.

- [ ] **Step 1: Install the graph library**

Run: `cd frontend && npm install react-force-graph-2d`
Expected: added to `frontend/package.json` `dependencies`, install succeeds with no peer-dependency errors against React 19. (If it does report a peer conflict, retry with `npm install react-force-graph-2d --legacy-peer-deps` and note that in the commit — the library's peer dep is `react: '*'`, so this should not be necessary.)

- [ ] **Step 2: Add graph types**

In `frontend/src/lib/types.ts`, add at the end:

```typescript
export interface GraphTag {
  id: string;
  name: string;
  color: string | null;
}

export interface GraphNode {
  id: string;
  title: string;
  type: string;
  is_starred: boolean;
  tags: GraphTag[];
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: 'tag' | 'semantic';
  shared_tags: GraphTag[];
  score?: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

- [ ] **Step 3: Build the Graph page**

Create `frontend/src/pages/Graph.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { Network } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import { getErrorMessage } from '../lib/utils';
import type { GraphResponse, GraphTag } from '../lib/types';

const NEUTRAL_NODE_COLOR = '#4b5563';
const DIMMED_COLOR = '#2d333b';
const SEMANTIC_EDGE_COLOR = '#6b7280';

function tagColor(tagId: string): string {
  let hash = 0;
  for (let i = 0; i < tagId.length; i++) {
    hash = tagId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export function Graph() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api.get<GraphResponse>('/graph');
        if (!cancelled) setData(result);
      } catch (error) {
        if (!cancelled) showToast('error', getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allTags = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, GraphTag>();
    for (const node of data.nodes) {
      for (const tag of node.tags) map.set(tag.id, tag);
    }
    return Array.from(map.values());
  }, [data]);

  const neighborIds = useMemo(() => {
    if (!data || !hoveredNodeId) return null;
    const ids = new Set<string>([hoveredNodeId]);
    for (const edge of data.edges) {
      const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
      if (source === hoveredNodeId) ids.add(target);
      if (target === hoveredNodeId) ids.add(source);
    }
    return ids;
  }, [data, hoveredNodeId]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const isDimmed = (nodeId: string): boolean => {
    if (!data || selectedTagIds.size === 0) return false;
    const node = data.nodes.find((n) => n.id === nodeId);
    return !node?.tags.some((t) => selectedTagIds.has(t.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data || data.nodes.length < 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <Network size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Not enough items yet</h3>
          <p className="text-text-muted">Add a few more items to start seeing how they connect.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Network size={32} />
          Graph
        </h1>
        <p className="text-text-muted mt-2">
          How your saved items connect, by shared tags and similar content.
        </p>
      </div>

      <div className="flex items-center gap-4 px-6 py-3 text-sm text-text-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block w-5 h-0.5" style={{ backgroundColor: '#0acffe' }} />
          shared tag
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block w-5 h-0.5"
            style={{ borderTop: `1px dashed ${SEMANTIC_EDGE_COLOR}` }}
          />
          similar content
        </span>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pb-3">
          {allTags.map((tag) => {
            const active = selectedTagIds.has(tag.id);
            const color = tagColor(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity"
                style={{
                  backgroundColor: color,
                  color: '#0a0f14',
                  opacity: active || selectedTagIds.size === 0 ? 1 : 0.4,
                  outline: active ? '2px solid #e6edf3' : 'none',
                }}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <ForceGraph2D
          graphData={{ nodes: data.nodes as any, links: data.edges as any }}
          nodeId="id"
          nodeLabel="title"
          nodeColor={(node: any) =>
            isDimmed(node.id) ? DIMMED_COLOR : node.tags?.[0] ? tagColor(node.tags[0].id) : NEUTRAL_NODE_COLOR
          }
          linkColor={(link: any) =>
            link.kind === 'tag' && link.shared_tags?.[0] ? tagColor(link.shared_tags[0].id) : SEMANTIC_EDGE_COLOR
          }
          linkLineDash={(link: any) => (link.kind === 'semantic' ? [2, 2] : null)}
          linkWidth={(link: any) => {
            if (!neighborIds) return 1;
            const source = typeof link.source === 'string' ? link.source : link.source.id;
            const target = typeof link.target === 'string' ? link.target : link.target.id;
            return neighborIds.has(source) && neighborIds.has(target) ? 2.5 : 1;
          }}
          onNodeHover={(node: any) => setHoveredNodeId(node?.id ?? null)}
          onNodeClick={(node: any) => navigate(`/item/${node.id}`)}
          backgroundColor="#0a0f14"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Register the route in App.tsx**

In `frontend/src/App.tsx`, add the import alongside the other page imports:

```typescript
import { Graph } from './pages/Graph';
```

And add the route inside the authenticated `<Routes>` block, alongside `/ask`:

```tsx
        <Route
          path="/graph"
          element={
            <ProtectedRoute>
              <Graph />
            </ProtectedRoute>
          }
        />
```

- [ ] **Step 5: Add the sidebar entry**

In `frontend/src/components/layout/Sidebar.tsx`, add `Network` to the `lucide-react` import on line 1:

```typescript
import { BrainCircuit, LayoutDashboard, Plus, FolderOpen, Tag, Share2, Settings, LogOut, Menu, X, Sparkles, Network } from 'lucide-react';
```

And add an entry to `menuItems`, after `ask`:

```typescript
    { id: 'graph', label: 'Graph', icon: <Network size={20} />, path: '/graph' },
```

- [ ] **Step 6: Register the view in AppShell.tsx**

In `frontend/src/components/layout/AppShell.tsx`, add to the `getCurrentView` if-chain, after the `/ask` line:

```typescript
    if (pathname === '/graph') return 'graph';
```

- [ ] **Step 7: Manually verify in the browser**

Run: `cd frontend && npm run dev` (with `backend` and `rag` also running, e.g. via `docker compose up --build` for the other two services, or their own `npm run dev`/`uvicorn` commands)

1. Log in, ensure you have at least 3-4 items: two sharing a tag, one or two with distinct tags and no overlap.
2. Click "Graph" in the sidebar — confirm the canvas renders, nodes are colored by tag, tag-edges are visible.
3. Hover a node — confirm its direct edges thicken and a tooltip with the title appears.
4. Click a node — confirm it navigates to that item's `/item/:id` page.
5. Click a tag chip in the filter row — confirm nodes without that tag dim; click it again to clear the filter.
6. If `rag`/embeddings are ingested for a couple of similar-but-untagged items, confirm a dashed semantic edge appears between them.
7. Stop the `rag` container/process, reload `/graph` — confirm the page still renders (tag-edges only), no crash, no error toast.
8. Log in as a second, throwaway account with its own (different) items — confirm its `/graph` never shows any node or edge belonging to the first account, even though both were computed through the same shared Chroma collection.

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/types.ts frontend/src/pages/Graph.tsx frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx frontend/src/components/layout/AppShell.tsx
git commit -m "feat(frontend): add Graph page visualizing item connections"
```
