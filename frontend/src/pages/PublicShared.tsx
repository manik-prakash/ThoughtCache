import { useState, useEffect } from 'react';
import { BrainCircuit, ExternalLink } from 'lucide-react';
import { Tag } from '../components/ui/Tag';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../lib/httpClient';
import type { Item } from '../lib/types';
import { renderMarkdown } from '../lib/markdown';

interface PublicSharedProps {
  slug: string;
}

export function PublicShared({ slug }: PublicSharedProps) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchSharedItem();
  }, [slug]);

  const fetchSharedItem = async () => {
    setLoading(true);
    try {
      const itemData = await api.get<Item>(`/public/shared/${slug}`);
      setItem(itemData);
    } catch (error) {
      console.log(error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-[#0a0f14]">
        <nav className="bg-[#11181f] border-b border-[#1a232c]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
            <BrainCircuit className="text-[#0acffe]" size={32} />
            <span className="text-xl font-bold text-text-primary">ThoughtCache</span>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-4">Item Not Found</h1>
          <p className="text-text-muted mb-8">This shared item doesn't exist or is no longer public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f14]">
      <nav className="bg-[#11181f] border-b border-[#1a232c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
          <BrainCircuit className="text-[#0acffe]" size={32} />
          <span className="text-xl font-bold text-text-primary">ThoughtCache</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#11181f] rounded-lg border border-[#1a232c] shadow-sm">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">{item.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <span className="capitalize">{item.type}</span>
              <span>•</span>
              <span>{formatDate(item.created_at)}</span>
            </div>

            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#0acffe] hover:text-[#28ffd3] mb-6"
              >
                <ExternalLink size={16} />
                <span className="break-all">{item.source_url}</span>
              </a>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {item.tags.map((tag) => (
                  <Tag key={tag.id} label={tag.name} color={tag.color || undefined} />
                ))}
              </div>
            )}

            <div
              className="prose prose-sm max-w-none text-text-primary"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-text-muted mb-4">Want to build your own knowledge base?</p>
          <a
            href="/"
            className="inline-block px-6 py-3 gradient-aqua text-[#0a0f14] rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Get Started with ThoughtCache
          </a>
        </div>
      </main>
    </div>
  );
}
