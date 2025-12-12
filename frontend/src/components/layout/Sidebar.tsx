import { Brain, LayoutDashboard, Plus, FolderOpen, Tag, Share2, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  currentView: string;
  onLogout: () => void;
  userDisplayName?: string;
  userAvatar?: string | null;
}

export function Sidebar({ currentView, onLogout, userDisplayName, userAvatar }: SidebarProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { id: 'new', label: 'New Item', icon: <Plus size={20} />, path: '/new' },
    { id: 'collections', label: 'Collections', icon: <FolderOpen size={20} />, path: '/collections' },
    { id: 'tags', label: 'Tags', icon: <Tag size={20} />, path: '/tags' },
    { id: 'shared', label: 'Shared', icon: <Share2 size={20} />, path: '/shared' },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#11181f] rounded-lg shadow-lg border border-[#1a232c] hover:bg-[#1a232c] text-text-primary"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:bg-[#11181f] lg:border-r lg:border-[#1a232c] lg:overflow-y-auto"
      >
        <div className="p-6 border-b border-[#1a232c]">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="text-[#0acffe]" size={32} />
            <span className="text-xl font-bold text-text-primary">ThoughtCache</span>
          </div>

          <div className="flex items-center gap-3">
            <Avatar src={userAvatar} alt={userDisplayName || 'User'} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {userDisplayName || 'User'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-6 py-3 text-left
                transition-colors
                ${currentView === item.id
                  ? 'bg-[#0acffe]/10 text-[#0acffe] border-r-2 border-[#0acffe]'
                  : 'text-text-muted hover:bg-[#1a232c]'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-[#1a232c]">
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-6 py-3 text-left
                transition-colors
                ${currentView === item.id
                  ? 'bg-[#0acffe]/10 text-[#0acffe] border-r-2 border-[#0acffe]'
                  : 'text-text-muted hover:bg-[#1a232c]'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-6 py-3 text-left text-red-500 hover:bg-[#1a232c] transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
