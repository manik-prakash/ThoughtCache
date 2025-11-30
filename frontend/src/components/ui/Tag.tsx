import { X } from 'lucide-react';

interface TagProps {
  label: string;
  color?: string;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ label, color, onRemove, className = '' }: TagProps) {
  const bgColor = color || 'bg-blue-100';
  const textColor = color ? 'text-gray-900' : 'text-blue-800';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} ${className}`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${label} tag`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
