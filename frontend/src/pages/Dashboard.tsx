import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ItemCard } from '../components/items/ItemCard';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import {getErrorMessage} from '../lib/utils';
import type { Item } from '../lib/types';

interface DashboardProps {
  onNavigate: (view: string, itemId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags?.some((tag) => tag.name.toLowerCase().includes(query))
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const fetchItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const query = new URLSearchParams();
      const queryString = query.toString();
      const itemsData = await api.get<Item[]>(`/items${queryString ? `?${queryString}` : ''}`);
      setItems(itemsData);
      setFilteredItems(itemsData);
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      const updatedItem = await api.patch<Item>(`/items/${id}/star`);
      setItems(items.map((i) => (i.id === id ? updatedItem : i)));
      showToast('success', updatedItem.is_starred ? 'Added to starred' : 'Removed from starred');
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.delete(`/items/${itemToDelete}`);
      setItems(items.filter((i) => i.id !== itemToDelete));
      setFilteredItems(filteredItems.filter((i) => i.id !== itemToDelete));
      showToast('success', 'Item deleted successfully');
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
    }

    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleShare = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.is_public && !item.share_slug) {
      try {
        const refreshedItem = await api.get<Item>(`/items/${id}`);
        if (refreshedItem.share_slug) {
          const url = `${window.location.origin}/shared/${refreshedItem.share_slug}`;
          setShareUrl(url);
          setShareModalOpen(true);
          // Update item in state
          setItems(items.map((i) => (i.id === id ? refreshedItem : i)));
          setFilteredItems(filteredItems.map((i) => (i.id === id ? refreshedItem : i)));
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
      onNavigate('edit', id);
      showToast('info', 'Enable public sharing for this item first');
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast('success', 'Link copied to clipboard');
    setShareModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Your knowledge at a glance</p>
          </div>
          <Button onClick={() => onNavigate('new')} className="flex items-center gap-2">
            <Plus size={20} />
            New Item
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search items, tags, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'No items match your search' : 'No items yet. Create your first one!'}
          </p>
          {!searchQuery && (
            <Button onClick={() => onNavigate('new')}>Create Item</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              content={item.content}
              type={item.type}
              sourceUrl={item.source_url}
              isStarred={item.is_starred}
              isPublic={item.is_public}
              tags={item.tags}
              createdAt={item.created_at}
              onEdit={(id) => {
                console.log('Edit clicked for item:', id);
                onNavigate('edit', id);
              }}
              onDelete={(id) => {
                setItemToDelete(id);
                setDeleteModalOpen(true);
              }}
              onToggleStar={handleToggleStar}
              onShare={handleShare}
              onClick={(id) => onNavigate('item', id)}
            />
          ))}
        </div>
      )}

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
