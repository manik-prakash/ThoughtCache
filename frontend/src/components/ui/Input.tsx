import { type InputHTMLAttributes, forwardRef } from 'react';
import { X } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, onClear, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-muted mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-3 py-2 border rounded-lg
              bg-[#11181f] text-text-primary placeholder-text-muted
              focus:outline-none focus:ring-2 focus:ring-[#0acffe] focus:border-transparent
              disabled:bg-[#1a232c] disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-[#1a232c]'}
              ${onClear && props.value ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {onClear && props.value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded"
              aria-label="Clear input"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1 text-sm text-text-muted">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
