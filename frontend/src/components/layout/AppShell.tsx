import { type ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/httpClient';
import type { ProfileResponse } from '../../lib/types';

interface AppShellProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: ReactNode;
}

export function AppShell({ currentView, onNavigate, children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        onLogout={signOut}
        userDisplayName={profile?.display_name || user?.email || 'User'}
        userAvatar={profile?.avatar_url}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
