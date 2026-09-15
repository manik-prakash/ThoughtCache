# Item Graph Visualization — "Graph" page

## Context

ThoughtCache items form a many-to-many relationship with tags (`Item` ↔ `ItemTag` ↔ `Tag`), and — since the RAG feature — every item's content is already embedded and stored per-chunk in Chroma Cloud (`rag/` service, `vectorstore.py`). Neither relationship is currently visualized. This adds a dedicated "Graph" page that renders the user's items as a force-directed node graph, connecting items that share a tag and/or are semantically similar, in the spirit of tools like Obsidian's graph view.

Decisions made with the user during brainstorming (do not re-litigate):
- **Edge basis**: both shared tags *and* semantic similarity (via existing RAG embeddings) — not tags alone, not a bipartite item/tag graph.
- **Similarity source**: a new endpoint on the existing `rag/` service (`GET /graph/similar-items`), reusing the embeddings already stored for RAG rather than computing/storing a second copy anywhere.
- **Placement**: a new dedicated `/graph` page (own sidebar entry), not a tab bolted onto Dashboard.
- **Interactions (v1)**: click a node → navigate to `/item/:id`; hover → highlight direct connections + tooltip; a tag filter/legend to isolate a subgraph. No editing from the graph itself.
- **Edge styling**: color-coded by kind (tag vs. semantic) with a small legend, so "why are these connected" is answerable at a glance.
- **Isolated items**: items with zero edges still render, as isolated nodes — this is itself informative ("this thought is disconnected from everything else").

## Architecture / data flow

No new database tables. Two edge types are computed in two different places and merged by the Node backend, which owns the single `/api/graph` contract the frontend consumes:

```
GET /api/graph (authenticate) ──▶ graphController.ts
        │
        ├─▶ Mongo: items + tags for user (same pattern as listItems) → build tag-edges
        │          (any pair of items sharing ≥1 tag; edge carries the shared tag(s))
        │
        └─▶ ragClient.getSimilarItemPairs(userId) ──HTTP──▶ rag: GET /graph/similar-items?user_id=...
                    best-effort: rag unreachable/unset → returns [], tag-only graph still renders
                                                              │
                                                              ▼
                                                    Chroma collection.get(where={"user_id": user_id},
                                                                           include=["embeddings","metadatas"])
                                                    mean-pool chunk vectors → 1 vector per item_id
                                                    pairwise cosine similarity (numpy, full matrix —
                                                    fine at personal-KB scale, not built for millions of items)
                                                    keep pairs >= GRAPH_SIMILARITY_THRESHOLD,
                                                    cap to top GRAPH_MAX_NEIGHBORS per item
                                                    → [{item_id_a, item_id_b, score}]
        │
        merge by unordered (item_a, item_b) pair key:
          - pair has a tag-edge only            → kind: 'tag'
          - pair has a semantic-edge only        → kind: 'semantic'
          - pair has both                        → kind: 'tag' (more explainable), score kept for tooltip
        ▼
{
  nodes: [{ id, title, type, is_starred, tags: [{id, name, color}] }],
  edges: [{ source, target, kind: 'tag' | 'semantic', shared_tags: [{id,name,color}], score?: number }]
}
```

## 1. `rag/` service additions

- **`rag/app/graph.py`** (new) — `compute_similar_pairs(user_id: str) -> list[SimilarPair]`:
  1. `_get_collection().get(where={"user_id": user_id}, include=["embeddings", "metadatas"])` — one call, all this user's chunk vectors.
  2. Group by `metadata["item_id"]`, mean-pool each item's chunk vectors into a single vector (handles items with multiple chunks without biasing toward longer items via raw chunk-count).
  3. Compute the full pairwise cosine-similarity matrix with numpy across that user's item vectors.
<<<<<<< HEAD
  4. Keep pairs with similarity ≥ `settings.GRAPH_SIMILARITY_THRESHOLD`, then cap each item to its top `settings.GRAPH_MAX_NEIGHBORS` by score (prevents a dense hairball for users with many similar items).
=======
  4. Keep pairs with similarity ≥ `settings.GRAPH_SIMILARITY_THRESHOLD`, then cap each item to its top `settings.GRAPH_MAX_NEIGHBORS` by score (prevents a dense hairball for users with many similar items). Note the cap is applied per-item during pair generation, so a given node's final edge count in the merged graph can exceed `GRAPH_MAX_NEIGHBORS` if other items independently nominated it as one of their own top neighbors — this is expected behavior, not a bug.
>>>>>>> b3fba24339ca365175932ddd9899df19267ecf0a
  5. Return `[{item_id_a, item_id_b, score}]`, deduped (unordered pair).
  - Users with 0–1 items (or 0–1 distinct item vectors) → return `[]` immediately, skip the matrix math.
- **`rag/app/config.py`** — add `GRAPH_SIMILARITY_THRESHOLD: float = 0.55` and `GRAPH_MAX_NEIGHBORS: int = 3`.
- **`rag/app/schemas.py`** — add `SimilarPair{item_id_a: str, item_id_b: str, score: float}` and `SimilarItemsResponse{pairs: list[SimilarPair]}`.
- **`rag/app/main.py`** — add `GET /graph/similar-items?user_id=...` (plain `def`, matches the existing sync-handler convention since this is CPU-bound numpy work, not I/O) → calls `graph.py`, wraps in `SimilarItemsResponse`.
- **`rag/requirements.txt`** — add `numpy` explicitly (currently only pulled transitively via `sentence-transformers`/torch; direct use in `graph.py` means it should be a declared dependency).

## 2. Node backend (`backend/`) additions

- **`backend/src/utils/ragClient.ts`** — add `getSimilarItemPairs(userId: string): Promise<SimilarPair[]>`, following the existing fire-and-forget-style resilience of this file: try/catch around the fetch, any failure (timeout, non-2xx, `RAG_SERVICE_URL` unset) resolves to `[]` rather than throwing. This is a read used to *enrich* the graph, not a user-facing action like `queryRag`, so it must never break the page.
- **`backend/src/controllers/graphController.ts`** (new) — `getGraph(req: AuthRequest, res)`:
  1. Fetch the user's items (like `listItems`) and their tags via `ItemTag`/`Tag`.
  2. Build tag-edges: for every pair of items sharing ≥1 tag, one edge with `shared_tags` = the intersection.
  3. Call `ragClient.getSimilarItemPairs(userId)`, filter pairs to only item-ids that belong to this user (defense in depth — the rag service already scopes by `user_id` via Chroma's `where` filter, but the controller shouldn't blindly trust an upstream id list).
  4. Merge into the single edge list per the dedup rule above.
  5. Return `{ nodes, edges }` per the JSON contract.
- **`backend/src/routes/graphRoutes.ts`** (new) — `router.get('/', authenticate, getGraph)`.
- **`backend/src/index.ts`** — `import graphRoutes from './routes/graphRoutes'; app.use('/api/graph', graphRoutes);`.

## 3. Frontend (`frontend/`) additions

- **New dependency**: `react-force-graph-2d` (canvas-based, D3-force layout under the hood; built-in pan/zoom/drag/hover/click handlers — the lowest-effort fit for this scale). Verify it installs and renders cleanly against React 19 during implementation; if it turns out incompatible, fall back to `d3-force` directly with a hand-rolled canvas renderer — noted as a risk, not expected to be an issue.
- **`frontend/src/lib/types.ts`** — add `GraphTag{id,name,color}`, `GraphNode{id,title,type,is_starred,tags:GraphTag[]}`, `GraphEdge{source,target,kind:'tag'|'semantic',shared_tags:GraphTag[],score?:number}`, `GraphResponse{nodes:GraphNode[],edges:GraphEdge[]}`.
- **`frontend/src/pages/Graph.tsx`** (new) — follows the `Ask.tsx`/`Dashboard.tsx` conventions (`useState`/`useToast`/`api` from `httpClient`/`getErrorMessage`):
  - Fetch `GET /api/graph` once on mount.
  - Empty state (0–1 items) → a card prompting the user to add more items, no canvas render.
  - Node fill color = the item's first tag's color if it has one, else a neutral gray — gives free visual tag-clustering independent of edges.
  - Edge color: `kind: 'tag'` → the shared tag's color (or a neutral tone if multiple/uncolored tags are shared); `kind: 'semantic'` → a fixed neutral accent, rendered thinner/dashed to read as visually distinct from tag edges.
  - A small legend (two line swatches: "shared tag" / "similar content").
  - Hover a node → highlight its direct edges and connected nodes, dim the rest; tooltip shows the item title.
  - Click a node → `navigate('/item/:id')`.
  - A tag-filter panel (reusing the `Tag` badge component from `components/ui/Tag`, listing tags the way `Tags.tsx` does) — selecting tags dims any node that has none of the selected tags; no selection = show everything.
- **Registration**, matching exactly how `Ask.tsx` was wired in:
  - `App.tsx`: `<Route path="/graph" element={<ProtectedRoute><Graph /></ProtectedRoute>} />`.
  - `Sidebar.tsx`: new `menuItems` entry with a `lucide-react` icon (e.g. `Share2` or `Waypoints` — pick one not already in use).
  - `AppShell.tsx`: `if (pathname === '/graph') return 'graph';` in the `getCurrentView` if-chain.

## Edge cases & resilience

- **rag service down/unset**: `getSimilarItemPairs` returns `[]`; graph still renders with tag-edges only, no error surfaced to the user (matches the existing RAG resilience pattern already established for item CRUD).
- **0–1 items**: empty-state card, no graph fetch of similarity data needed (both backend and rag short-circuit cheaply).
- **User with items but no tags and rag also down**: graph still renders, all nodes isolated — a valid, informative state, not an error.
- **Cross-user isolation**: the rag-service similarity query is already scoped by Chroma's `where={"user_id": ...}` filter (existing, audited code path in `vectorstore.py`); the Node controller additionally filters returned pairs to the requesting user's own item-id set before merging, so even a hypothetical rag-service bug can't leak another user's item ids into this response.

## Verification

Manual, via `docker compose up --build`:
1. Seed a handful of items: some sharing tags, some with similar content but no shared tags, one or two with neither (isolated).
2. Load `/graph` — confirm nodes render, tag-edges and semantic-edges are visually distinct (color/legend), isolated items still appear as separate nodes.
3. Hover a node — confirm its direct edges/neighbors highlight and a title tooltip appears.
4. Click a node — confirm navigation to `/item/:id`.
5. Use the tag filter — confirm dimming behaves correctly for single and multiple selected tags, and clearing the filter restores the full graph.
6. Stop the `rag` container, reload `/graph` — confirm tag-edges still render, no error toast, no crash.
7. Log in as a second, throwaway account with its own items — confirm its graph never shows the first account's items or edges.
