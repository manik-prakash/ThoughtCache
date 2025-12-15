import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/httpClient';
import type { ProfileResponse } from '../../lib/types';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  const getCurrentView = (pathname: string): string => {
    if (pathname === '/dashboard' || pathname === '/') return 'dashboard';
    if (pathname === '/new') return 'new';
    if (pathname.startsWith('/edit')) return 'edit';
    if (pathname.startsWith('/item')) return 'item';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/collections') return 'collections';
    if (pathname === '/tags') return 'tags';
    if (pathname === '/shared') return 'shared';
    return 'dashboard';
  };

  const currentView = getCurrentView(location.pathname);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await api.get<ProfileResponse>('/profile');
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <div className="h-screen overflow-hidden bg-[#0a0f14] flex">
      <Sidebar
        currentView={currentView}
        onLogout={signOut}
        userDisplayName={profile?.display_name || user?.email || 'User'}
        userAvatar={profile?.avatar_url}
      />
      <main className="flex-1 overflow-y-auto lg:pl-64">
        {children}
      </main>
    </div>
  );
}