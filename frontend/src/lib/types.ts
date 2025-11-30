
export interface ApiUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: string;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'thought' | 'link' | 'bookmark' | 'clip';
  source_url: string | null;
  source_metadata?: Record<string, unknown>;
  is_starred: boolean;
  is_public: boolean;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  displayName?: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ProfileResponse {
  display_name: string | null;
  avatar_url: string | null;
}

export interface ThemeResponse {
  theme: 'light' | 'dark';
}

export interface ExportResponse {
  items: Item[];
  tags: Tag[];
}

