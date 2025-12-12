import { type ReactNode, useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute mt-2 py-2 bg-[#1a232c] rounded-lg shadow-lg border border-[#1a232c] min-w-[200px] z-50 ${align === 'right' ? 'right-0' : 'left-0'
            }`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function DropdownItem({ children, onClick, icon, className = '' }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-[#11181f] flex items-center gap-2 transition-colors ${className}`}
      role="menuitem"
    >
      {icon}
      {children}
    </button>
  );
}

interface DropdownDividerProps {
  className?: string;
}

export function DropdownDivider({ className = '' }: DropdownDividerProps) {
  return <div className={`my-1 border-t border-[#1a232c] ${className}`} />;
}
