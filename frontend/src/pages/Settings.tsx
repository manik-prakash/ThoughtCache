import { useState, useEffect } from 'react';
import { Moon, Sun, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/httpClient';
import {getErrorMessage} from '../lib/utils';
import type { ProfileResponse, ExportResponse } from '../lib/types';

export function Settings() {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const data = await api.get<ProfileResponse>('/profile');
      setDisplayName(data.display_name || '');
      setAvatarUrl(data.avatar_url || '');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await api.put('/profile', { display_name: displayName, avatar_url: avatarUrl || null });
      showToast('success', 'Profile updated successfully');
      await fetchProfile();
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      const exportData = await api.get<ExportResponse>('/export');
      const fullExport = {
        exported_at: new Date().toISOString(),
        ...exportData,
      };

      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `second-brain-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Data exported successfully');
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-8">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>

          <div className="flex items-center gap-4 mb-6">
            <Avatar src={avatarUrl || null} alt={displayName || user?.email || 'User'} size="lg" />
            <div>
              <p className="text-sm text-gray-500">
                {avatarUrl ? 'Your custom avatar' : 'Your avatar is generated from your initials'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
            />

            <Input
              label="Avatar URL"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              hint="Enter a URL to your avatar image"
            />

            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
              hint="Email cannot be changed"
            />

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Theme</p>
              <p className="text-sm text-gray-500">Switch between light and dark mode</p>
            </div>
            <Button
              variant="secondary"
              onClick={toggleTheme}
              className="flex items-center gap-2"
            >
              {theme === 'light' ? (
                <>
                  <Moon size={18} />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun size={18} />
                  Light Mode
                </>
              )}
            </Button>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900 mb-2">Export Your Data</p>
              <p className="text-sm text-gray-500 mb-4">
                Download all your items and tags as a JSON file
              </p>
              <Button
                variant="secondary"
                onClick={handleExportData}
                className="flex items-center gap-2"
              >
                <Download size={18} />
                Export Data
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">New item</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono">
                N
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Focus search</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono">
                /
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Go to dashboard</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono mr-1">
                G
              </kbd>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono">
                D
              </kbd>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
