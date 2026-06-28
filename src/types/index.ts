/**
 * KrishakBondhu - TypeScript Type Definitions
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'expert' | 'admin';
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DiseaseResult {
  disease_name: string;
  confidence: number;
  plant: string | null;
  symptoms: string[];
  remedy: string | null;
  prevention: string | null;
  image_url: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  title: string;
  description: string;
  image_url: string | null;
  disease_result: {
    disease_name: string | null;
    confidence: number | null;
    symptoms: string[] | null;
    remedy: string | null;
  } | null;
  likes: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  page_size: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

export interface ExpertRequest {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  image_url: string | null;
  disease_result: {
    disease_name: string | null;
    confidence: number | null;
  } | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  expert_id: string | null;
  expert_name: string | null;
  expert_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertRequestListResponse {
  requests: ExpertRequest[];
  total: number;
  page: number;
  page_size: number;
}

export interface PredictionHistoryItem {
  id: string;
  disease_name: string;
  confidence: number;
  image_url: string;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_posts: number;
  total_expert_requests: number;
  pending_requests: number;
  total_predictions: number;
  role_breakdown: {
    users: number;
    experts: number;
    admins: number;
  };
}
