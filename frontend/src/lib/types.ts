
export interface ApiUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: string;
  isGuest?: boolean;
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

export interface ExportResponse {
  items: Item[];
  tags: Tag[];
}

export interface RagSource {
  item_id: string;
  title: string;
  chunk_index: number;
  snippet: string;
  score: number;
}

export interface RagQueryResponse {
  answer: string;
  sources: RagSource[];
  has_context: boolean;
}

export interface GraphTag {
  id: string;
  name: string;
  color: string | null;
}

export interface GraphNode {
  id: string;
  title: string;
  type: string;
  is_starred: boolean;
  tags: GraphTag[];
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: 'tag' | 'semantic';
  shared_tags: GraphTag[];
  score?: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

