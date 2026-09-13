const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL;

async function ragFetch(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${RAG_SERVICE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

interface RagIngestItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
}

export async function ingestItem(item: RagIngestItem): Promise<void> {
  if (!RAG_SERVICE_URL) return;
  try {
    const res = await ragFetch(
      '/ingest',
      {
        method: 'POST',
        body: JSON.stringify({
          item_id: item.id,
          user_id: item.user_id,
          title: item.title,
          content: item.content,
        }),
      },
      5000
    );
    if (!res.ok) {
      console.error(`[ragClient] ingest failed for item ${item.id}: ${res.status}`);
    }
  } catch (err) {
    console.error(`[ragClient] ingest error for item ${item.id}:`, err);
  }
}

export async function deleteItemChunks(itemId: string): Promise<void> {
  if (!RAG_SERVICE_URL) return;
  try {
    const res = await ragFetch(`/items/${itemId}`, { method: 'DELETE' }, 5000);
    if (!res.ok) {
      console.error(`[ragClient] delete failed for item ${itemId}: ${res.status}`);
    }
  } catch (err) {
    console.error(`[ragClient] delete error for item ${itemId}:`, err);
  }
}

export interface RagQuerySource {
  item_id: string;
  title: string;
  chunk_index: number;
  snippet: string;
  score: number;
}

export interface RagQueryResult {
  answer: string;
  sources: RagQuerySource[];
  has_context: boolean;
}

export async function queryRag(userId: string, question: string): Promise<RagQueryResult> {
  if (!RAG_SERVICE_URL) {
    throw new Error('RAG service is not configured');
  }
  const res = await ragFetch(
    '/query',
    {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, question }),
    },
    30000
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { detail?: string });
    throw new Error(body.detail || `RAG service responded with ${res.status}`);
  }
  return res.json();
}
