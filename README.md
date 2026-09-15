# ThoughtCache

I built ThoughtCache as my own personal "second brain" — a place to quickly capture thoughts, links, bookmarks, and clips as I come across them, tag and organize them, and later find my way back to anything I've saved. I got tired of half-finished notes scattered across browser bookmarks, random text files, and chat threads, so I built one place for all of it.

## What I can do with it

- **Capture items** — save a thought, a link, a bookmark, or a clip, each with a title, content, and optional source URL.
- **Tag and organize** — attach tags to items and browse them grouped into collections.
- **Star and search** — star the things I want to come back to, and search across titles, content, and tags.
- **Share selectively** — mark an item public and get a shareable link that anyone can open without an account.
- **Export everything** — download all my items and tags as a single JSON file whenever I want a full backup.
- **Ask my own notes** — I can ask a plain-language question and get an answer grounded in what I've actually saved, with links back to the source items. No more scrolling through months of notes trying to remember where I wrote something down.
- **See how it all connects** — a graph view of my items, linked by shared tags and by semantic similarity (reusing the same embeddings Ask relies on), so I can spot clusters and forgotten threads I wouldn't find by scrolling a list.
- **Try it without signing up** — click "Try the Demo" and I drop you straight into a real, working account pre-loaded with sample notes, links, and tags — search, tag, star, all of it. It's a throwaway account; I auto-delete it (and everything in it) 24 hours after it's created.

## How it's built

ThoughtCache is three services:

- **`backend/`** — Node.js, Express, TypeScript, MongoDB (Mongoose). Handles auth (JWT), items, tags, profiles, public sharing, and export.
- **`frontend/`** — React 19, Vite, TailwindCSS 4, React Router. The whole UI I actually use day to day.
- **`rag/`** — Python, FastAPI. This is what powers Ask and the graph view: it chunks and embeds my items locally with `sentence-transformers`, stores the vectors in Chroma Cloud, calls Google's Gemini API to answer questions grounded in whatever it retrieves, and computes item-to-item similarity for the graph's "similar content" edges. It's an internal-only service — the frontend never talks to it directly, only the Express backend does, after checking who I am.

### How Ask actually works

Whenever I create, edit, or delete an item, the backend quietly tells the RAG service in the background, so it never slows down saving something. When I ask a question, the RAG service embeds it, pulls back the most relevant chunks from *my own* items only, hands them to Gemini as context, and returns an answer with citations back to the source items. If nothing relevant is saved yet, it says so instead of guessing.

## Running it locally

The whole stack runs with Docker Compose:

```bash
docker compose up --build
```

Before that, I need to fill in:
- `backend/.env` (copy from `backend/.env.example`) — Mongo URI, JWT secret, etc.
- `frontend/.env` (copy from `frontend/.env.example`) — API base URL.
- `rag/.env` (copy from `rag/.env.example`) — my Chroma Cloud tenant/database/API key and my Gemini API key. Without these, item saving still works fine; only Ask and the graph's "similar content" edges won't.

Once it's up: frontend on `http://localhost`, backend on `http://localhost:3000`.

## Deploying it

`ops/` has the Kubernetes manifests I use for a real deployment — each service (`backend`, `frontend`, `rag`) gets its own namespace, a Deployment, and a ClusterIP Service, with only the frontend exposed through an Ingress. The RAG service stays internal on purpose; it's never reachable from outside the cluster.
