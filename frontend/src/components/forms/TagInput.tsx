import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Tag } from '../ui/Tag';
import { Input } from '../ui/Input';

interface TagInputProps {
  selectedTags: Array<{ id: string; name: string; color: string | null }>;
  availableTags: Array<{ id: string; name: string; color: string | null }>;
  onTagsChange: (tags: Array<{ id: string; name: string; color: string | null }>) => void;
  onCreateTag: (name: string) => Promise<{ id: string; name: string; color: string | null } | null>;
}

export function TagInput({ selectedTags, availableTags, onTagsChange, onCreateTag }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; color: string | null }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedTags.some((t) => t.id === tag.id)
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, availableTags, selectedTags]);

  const handleAddTag = (tag: { id: string; name: string; color: string | null }) => {
    onTagsChange([...selectedTags, tag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!inputValue.trim()) return;

    const newTag = await onCreateTag(inputValue.trim());
    if (newTag) {
      handleAddTag(newTag);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleAddTag(suggestions[0]);
      } else {
        handleCreateTag();
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Tags</label>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Tag key={tag.id} label={tag.name} color={tag.color || undefined} onRemove={() => handleRemoveTag(tag.id)} />
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search or create tags..."
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => inputValue && setShowSuggestions(true)}
        />

        {showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.length > 0 ? (
              suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <Tag label={tag.name} color={tag.color || undefined} />
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={handleCreateTag}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-blue-600"
              >
                <Plus size={16} />
                Create "{inputValue}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
