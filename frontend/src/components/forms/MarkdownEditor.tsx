import { useState } from 'react';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Eye, Edit } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, label, placeholder }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

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

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
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
          className="min-h-[200px] p-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none"
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
