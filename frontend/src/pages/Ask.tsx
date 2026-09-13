import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import { getErrorMessage } from '../lib/utils';
import type { RagQueryResponse, RagSource } from '../lib/types';

interface QAEntry {
  id: string;
  question: string;
  answer?: string;
  sources?: RagSource[];
  hasContext?: boolean;
  loading: boolean;
  error?: string;
}

export function Ask() {
  const [history, setHistory] = useState<QAEntry[]>([]);
  const [input, setInput] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isBusy = history.some((entry) => entry.loading);

  const handleAsk = async () => {
    const question = input.trim();
    if (!question || isBusy) return;

    const entryId = crypto.randomUUID();
    setHistory((h) => [...h, { id: entryId, question, loading: true }]);
    setInput('');

    try {
      const result = await api.post<RagQueryResponse>('/rag/query', { question });
      setHistory((h) =>
        h.map((e) =>
          e.id === entryId
            ? {
              ...e,
              loading: false,
              answer: result.answer,
              sources: dedupeSources(result.sources),
              hasContext: result.has_context,
            }
            : e
        )
      );
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setHistory((h) => h.map((e) => (e.id === entryId ? { ...e, loading: false, error: message } : e)));
      showToast('error', message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Sparkles size={32} />
          Ask
        </h1>
        <p className="text-text-muted mt-2">
          Ask a question and get an answer grounded in your saved items.
        </p>
      </div>

      <div className="flex-1 space-y-6 mb-6">
        {history.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            Ask anything about what you've saved in ThoughtCache.
          </div>
        )}

        {history.map((entry) => (
          <div key={entry.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-[#0acffe] text-[#0a0f14] rounded-lg px-4 py-2 max-w-[80%] font-medium">
                {entry.question}
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-[#11181f] border border-[#1a232c] rounded-lg px-4 py-3 max-w-[80%] w-full">
                {entry.loading ? (
                  <Spinner size="sm" />
                ) : entry.error ? (
                  <p className="text-red-500 text-sm">{entry.error}</p>
                ) : (
                  <>
                    {entry.hasContext === false ? (
                      <p className="text-text-muted italic">{entry.answer}</p>
                    ) : (
                      <p className="text-text-primary" style={{ whiteSpace: 'pre-wrap' }}>
                        {entry.answer}
                      </p>
                    )}

                    {entry.sources && entry.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#1a232c] flex flex-wrap gap-2">
                        {entry.sources.map((source) => (
                          <button
                            key={source.item_id}
                            type="button"
                            onClick={() => navigate(`/item/${source.item_id}`)}
                            className="text-xs px-2.5 py-1 rounded-full bg-[#1a232c] text-[#0acffe] hover:bg-[#0acffe]/20 transition-colors"
                          >
                            {source.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-6 bg-[#0a0f14] pt-2">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your saved items..."
              rows={2}
              disabled={isBusy}
            />
          </div>
          <Button onClick={handleAsk} disabled={isBusy || !input.trim()} className="flex items-center gap-2">
            <Send size={18} />
            Ask
          </Button>
        </div>
      </div>
    </div>
  );
}

function dedupeSources(sources: RagSource[]): RagSource[] {
  const seen = new Map<string, RagSource>();
  for (const source of sources) {
    if (!seen.has(source.item_id)) {
      seen.set(source.item_id, source);
    }
  }
  return Array.from(seen.values());
}
