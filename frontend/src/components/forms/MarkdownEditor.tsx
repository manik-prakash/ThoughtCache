import { useState } from 'react';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Eye, Edit } from 'lucide-react';
import { renderMarkdown } from '../../lib/markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, label, placeholder }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-text-muted">{label}</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-1"
          >
            {isPreview ? (
              <>
                <Edit size={16} />
                Edit
              </>
            ) : (
              <>
                <Eye size={16} />
                Preview
              </>
            )}
          </Button>
        </div>
      )}

      {isPreview ? (
        <div
          className="min-h-[200px] p-3 border border-[#1a232c] rounded-lg bg-[#11181f] prose prose-sm max-w-none text-text-primary"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="font-mono text-sm"
        />
      )}
    </div>
  );
}
