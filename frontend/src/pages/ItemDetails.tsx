import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Share2, Star, ExternalLink, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api} from '../lib/httpClient';
import type { Item } from '../lib/types';
import {getErrorMessage} from '../lib/utils';
interface ItemDetailsProps {
  itemId: string;
  onNavigate: (view: string, itemId?: string) => void;
}

export function ItemDetails({ itemId, onNavigate }: ItemDetailsProps) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const itemData = await api.get<Item>(`/items/${itemId}`);
      setItem(itemData);
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
      onNavigate('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!item) return;

    try {
      const updatedItem = await api.patch<Item>(`/items/${itemId}/star`);
      setItem(updatedItem);
      showToast('success', updatedItem.is_starred ? 'Added to starred' : 'Removed from starred');
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/items/${itemId}`);
      showToast('success', 'Item deleted successfully');
      onNavigate('dashboard');
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
      console.log(error);
    }
  };

  const handleShare = async () => {
    if (!item) return;

    // If item is public but doesn't have share_slug, refresh the item
    if (item.is_public && !item.share_slug) {
      try {
        const refreshedItem = await api.get<Item>(`/items/${itemId}`);
        if (refreshedItem.share_slug) {
          const url = `${window.location.origin}/shared/${refreshedItem.share_slug}`;
          setShareUrl(url);
          setShareModalOpen(true);
          setItem(refreshedItem);
          return;
        }
      } catch (error) {
        console.error('Failed to refresh item:', error);
      }
    }

    if (item.share_slug) {
      const url = `${window.location.origin}/shared/${item.share_slug}`;
      setShareUrl(url);
      setShareModalOpen(true);
    } else {
      onNavigate('edit', itemId);
      showToast('info', 'Enable public sharing for this item first');
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast('success', 'Link copied to clipboard');
    setShareModalOpen(false);
  };

  const handleExport = () => {
    if (!item) return;

    const exportData = {
      title: item.title,
      content: item.content,
      type: item.type,
      source_url: item.source_url,
      tags: item.tags?.map((t: any) => t.name),
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Item exported successfully');
  };

  const renderMarkdown = (text: string) => {
    let html = text;

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-2 mt-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-3 mt-4">$1</h1>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc mb-2">$1</ul>');

    html = html.replace(/\n/g, '<br>');

    return html;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!item) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 mb-4">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="capitalize">{item.type}</span>
                <span>•</span>
                <span>Created {formatDate(item.created_at)}</span>
                {item.updated_at !== item.created_at && (
                  <>
                    <span>•</span>
                    <span>Updated {formatDate(item.updated_at)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleToggleStar}>
                <Star size={18} className={item.is_starred ? 'fill-yellow-500 text-yellow-500' : ''} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('edit', itemId)}>
                <Edit size={18} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 size={18} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download size={18} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 size={18} className="text-red-600" />
              </Button>
            </div>
          </div>

          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
            >
              <ExternalLink size={16} />
              <span className="break-all">{item.source_url}</span>
            </a>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {item.tags.map((tag: any) => (
                <Tag key={tag.id} label={tag.name} color={tag.color || undefined} />
              ))}
            </div>
          )}

          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }}
          />
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Item"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Item"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">Share this link with anyone:</p>
          <Input value={shareUrl} readOnly className="mb-4" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShareModalOpen(false)}>
              Close
            </Button>
            <Button onClick={copyShareUrl}>Copy Link</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
