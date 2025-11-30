import { MoreVertical, Star, Share2, Edit, Trash2, ExternalLink, FileText, Link as LinkIcon, Bookmark, Image } from 'lucide-react';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Tag } from '../ui/Tag';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';

interface ItemCardProps {
  id: string;
  title: string;
  content: string;
  type: 'thought' | 'link' | 'bookmark' | 'clip';
  sourceUrl?: string | null;
  isStarred: boolean;
  isPublic: boolean;
  tags?: Array<{ id: string; name: string; color: string | null }>;
  createdAt: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onShare: (id: string) => void;
  onClick: (id: string) => void;
}

export function ItemCard({
  id,
  title,
  content,
  type,
  sourceUrl,
  isStarred,
  isPublic,
  tags = [],
  createdAt,
  onEdit,
  onDelete,
  onToggleStar,
  onShare,
  onClick,
}: ItemCardProps) {
  const typeIcons = {
    thought: <FileText size={16} className="text-blue-600" />,
    link: <LinkIcon size={16} className="text-green-600" />,
    bookmark: <Bookmark size={16} className="text-orange-600" />,
    clip: <Image size={16} className="text-pink-600" />,
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardBody onClick={() => onClick(id)}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1">
            {typeIcons[type]}
            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            {isStarred && <Star size={16} className="text-yellow-500 fill-yellow-500 shrink-0" />}
            {isPublic && <Share2 size={16} className="text-blue-500 shrink-0" />}
          </div>
          <Dropdown
            trigger={
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Item options"
              >
                <MoreVertical size={20} className="text-gray-600" />
              </button>
            }
          >
            <DropdownItem onClick={() => onEdit(id)} icon={<Edit size={16} />}>
              Edit
            </DropdownItem>
            <DropdownItem onClick={() => onToggleStar(id)} icon={<Star size={16} />}>
              {isStarred ? 'Unstar' : 'Star'}
            </DropdownItem>
            <DropdownItem onClick={() => onShare(id)} icon={<Share2 size={16} />}>
              Share
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem onClick={() => onDelete(id)} icon={<Trash2 size={16} />} className="text-red-600 hover:bg-red-50">
              Delete
            </DropdownItem>
          </Dropdown>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{content || 'No content'}</p>

        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-3"
          >
            <ExternalLink size={14} />
            <span className="truncate">{sourceUrl}</span>
          </a>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Tag key={tag.id} label={tag.name} color={tag.color || undefined} />
            ))}
          </div>
        )}
      </CardBody>

      <CardFooter>
        <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
      </CardFooter>
    </Card>
  );
}
