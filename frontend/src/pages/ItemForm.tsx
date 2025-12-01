import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MarkdownEditor } from '../components/forms/MarkdownEditor';
import { TagInput } from '../components/forms/TagInput';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import { getErrorMessage } from '../lib/utils';
import type { Item, Tag } from '../lib/types';

type TagInputTag = { id: string; name: string; color: string | null };

interface ItemFormProps {
  itemId?: string;
  onNavigate: (view: string) => void;
}

const ITEM_TYPES = ['thought', 'link', 'bookmark', 'clip'] as const;
const DRAFT_SAVE_INTERVAL = 10000;
const DRAFT_KEY_NEW = 'draft_new';

export function ItemForm({ itemId, onNavigate }: ItemFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'thought' | 'link' | 'bookmark' | 'clip'>('thought');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [shareSlug, setShareSlug] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagInputTag[]>([]);
  const [availableTags, setAvailableTags] = useState<TagInputTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!itemId);
  const { user } = useAuth();
  const { showToast } = useToast();

  const showSourceUrl = type === 'link' || type === 'bookmark';

  const generateSlug = useCallback((text: string) => {
    const baseSlug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50); 

    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setType('thought');
    setSourceUrl('');
    setIsPublic(false);
    setShareSlug('');
    setSelectedTags([]);
    setLoading(false);
  }, []);

  const fetchTags = useCallback(async () => {
    if (!user) return;

    try {
      const data = await api.get<Tag[]>('/tags');
      setAvailableTags(data.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      })));
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      showToast('error', 'Failed to load tags');
    }
  }, [user, showToast]);

  const fetchItem = useCallback(async () => {
    if (!itemId || !user) return;

    setInitialLoading(true);
    try {
      const itemData = await api.get<Item>(`/items/${itemId}`);
      setTitle(itemData.title);
      setContent(itemData.content);
      setType(itemData.type);
      setSourceUrl(itemData.source_url || '');
      setIsPublic(itemData.is_public);
      setShareSlug(itemData.share_slug || '');

      if (itemData.tags) {
        setSelectedTags(itemData.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })));
      }
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
      onNavigate('dashboard');
    } finally {
      setInitialLoading(false);
    }
  }, [itemId, user, showToast, onNavigate]);

  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY_NEW);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setType(draft.type || 'thought');
        setSourceUrl(draft.sourceUrl || '');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  const saveDraft = useCallback(() => {
    if (itemId || (!title && !content)) return;

    try {
      localStorage.setItem(DRAFT_KEY_NEW, JSON.stringify({
        title,
        content,
        type,
        sourceUrl
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
      } else {
        console.error('Failed to save draft:', error);
      }
    }
  }, [itemId, title, content, type, sourceUrl]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY_NEW);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  const handleCreateTag = useCallback(async (name: string): Promise<TagInputTag | null> => {
    if (!user) return null;

    try {
      const data = await api.post<Tag>('/tags', { name });
      const tagInputTag: TagInputTag = {
        id: data.id,
        name: data.name,
        color: data.color
      };
      setAvailableTags(prev => [...prev, tagInputTag]);
      return tagInputTag;
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
      return null;
    }
  }, [user, showToast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('error', 'Title is required');
      return;
    }
    if (!user) return;

    setLoading(true);

    try {
      const itemData = {
        title: title.trim(),
        content: content.trim(),
        type,
        source_url: sourceUrl.trim() || null,
        is_public: isPublic,
        share_slug: isPublic ? (shareSlug.trim() || generateSlug(title)) : undefined,
        tag_ids: selectedTags.map((tag) => tag.id),
      };

      if (itemId) {
        const updatedItem = await api.put<Item>(`/items/${itemId}`, itemData);
        showToast('success', 'Item updated successfully');
        if (isPublic && updatedItem.share_slug) {
          setShareSlug(updatedItem.share_slug);
        }
      } else {
        const res = await api.post<Item>('/items', itemData);
        console.log(res);
        showToast('success', 'Item created successfully');
        clearDraft();
        resetForm();
      }
      onNavigate('dashboard');
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    title,
    content,
    type,
    sourceUrl,
    isPublic,
    shareSlug,
    selectedTags,
    itemId,
    user,
    showToast,
    generateSlug,
    clearDraft,
    resetForm,
    onNavigate
  ]);

  useEffect(() => {
    if (!user) return;

    fetchTags();

    if (itemId) {
      fetchItem();
    } else {
      loadDraft();
      setInitialLoading(false);
    }
  }, [user, itemId, fetchTags, fetchItem, loadDraft]);

  useEffect(() => {
    if (itemId) return;
    const interval = setInterval(saveDraft, DRAFT_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [itemId, saveDraft]);

  useEffect(() => {
    return () => {
      if (!itemId && (title || content)) {
        saveDraft();
      }
    };
  }, [itemId, title, content, saveDraft]);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {itemId ? 'Edit Item' : 'New Item'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title..."
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <div className="flex gap-2">
            {ITEM_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${type === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <MarkdownEditor
          label="Content"
          value={content}
          onChange={setContent}
          placeholder="Write your thoughts"
        />

        {showSourceUrl && (
          <Input
            label="Source URL"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com"
          />
        )}

        <TagInput
          selectedTags={selectedTags}
          availableTags={availableTags}
          onTagsChange={setSelectedTags}
          onCreateTag={handleCreateTag}
        />

        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Make this item public
            </span>
          </label>

          {isPublic && (
            <div className="mt-4">
              <Input
                label="Custom Share Slug (optional)"
                type="text"
                value={shareSlug}
                onChange={(e) => setShareSlug(e.target.value)}
                placeholder="my-awesome-item"
                hint="Leave empty to auto-generate from title"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save size={20} />
            {loading ? 'Saving...' : itemId ? 'Update Item' : 'Create Item'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onNavigate('dashboard')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}