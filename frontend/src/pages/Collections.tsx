import { useState, useEffect } from 'react';
import { FolderOpen} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ItemCard } from '../components/items/ItemCard';
import { Tag as TagBadge } from '../components/ui/Tag';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import { getErrorMessage } from '../lib/utils';
import type { Item, Tag } from '../lib/types';
import { useNavigate } from 'react-router-dom';

interface Collection {
    tag: Tag;
    items: Item[];
}

export function Collections() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCollections();
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCollections = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Fetch both tags and items
            const [tags, items] = await Promise.all([
                api.get<Tag[]>('/tags'),
                api.get<Item[]>('/items')
            ]);

            // Group items by tags
            const groupedCollections = tags
                .map(tag => ({
                    tag,
                    items: items.filter(item =>
                        item.tags?.some(itemTag => itemTag.id === tag.id)
                    )
                }))
                .filter(collection => collection.items.length > 0)
                .sort((a, b) => a.tag.name.localeCompare(b.tag.name));

            setCollections(groupedCollections);
        } catch (error) {
            showToast('error', getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (itemId: string) => {
        navigate(`/item/${itemId}`);
    };

    const handleItemEdit = (itemId: string) => {
        navigate(`/edit/${itemId}`);
    };

    const handleItemDelete = async (itemId: string) => {
        try {
            await api.delete(`/items/${itemId}`);
            showToast('success', 'Item deleted successfully');
            // Refresh collections
            fetchCollections();
        } catch (error) {
            showToast('error', getErrorMessage(error));
        }
    };

    const handleItemShare = async (itemId: string) => {
        const item = collections
            .flatMap((collection) => collection.items)
            .find((i) => i.id === itemId);
        if (!item) return;

        if (!item.is_public) {
            showToast('info', 'This item must be public to share. Redirecting to edit...');
            setTimeout(() => navigate(`/edit/${itemId}`), 1000);
            return;
        }

        try {
            const targetItem = item.share_slug ? item : await api.get<Item>(`/items/${itemId}`);
            if (targetItem.share_slug) {
                const shareUrl = `${window.location.origin}/shared/${targetItem.share_slug}`;
                await navigator.clipboard.writeText(shareUrl);
                showToast('success', 'Share link copied to clipboard!');
                if (!item.share_slug) fetchCollections();
            } else {
                showToast('error', 'Failed to generate share link');
            }
        } catch (error) {
            showToast('error', getErrorMessage(error));
        }
    };

    const handleItemToggleStar = async (itemId: string) => {
        try {
            await api.patch<Item>(`/items/${itemId}/star`);
            showToast('success', 'Item starred successfully');
            // Refresh collections to update star status
            fetchCollections();
        } catch (error) {
            showToast('error', getErrorMessage(error));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                            <FolderOpen size={32} />
                            Collections
                        </h1>
                        <p className="text-text-muted mt-2">
                            Browse your items organized by tags ({collections.length} {collections.length === 1 ? 'collection' : 'collections'})
                        </p>
                    </div>
                </div>
            </div>

            {/* Collections */}
            {collections.length === 0 ? (
                <Card className="p-12 text-center">
                    <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                        No collections yet
                    </h3>
                    <p className="text-text-muted mb-4">
                        Create items with tags to see them organized into collections
                    </p>
                    <Button onClick={() => navigate('/new')}>
                        Create Your First Item
                    </Button>
                </Card>
            ) : (
                <div className="space-y-8">
                    {collections.map((collection) => (
                        <div key={collection.tag.id} className="space-y-4">
                            {/* Collection Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <TagBadge
                                        label={collection.tag.name}
                                        color={collection.tag.color || undefined}
                                    />
                                    <span className="text-sm text-text-muted">
                                        {collection.items.length} {collection.items.length === 1 ? 'item' : 'items'}
                                    </span>
                                </div>
                            </div>

                            {/* Collection Items */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {collection.items.map((item) => (
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
                                        onClick={() => handleItemClick(item.id)}
                                        onEdit={() => handleItemEdit(item.id)}
                                        onDelete={() => handleItemDelete(item.id)}
                                        onShare={() => handleItemShare(item.id)}
                                        onToggleStar={() => handleItemToggleStar(item.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
