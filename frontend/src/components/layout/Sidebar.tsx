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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
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
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">Second Brain</span>
          </div>

          <div className="flex items-center gap-3">
            <Avatar src={userAvatar} alt={userDisplayName || 'User'} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
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
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-200">
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
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-6 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
