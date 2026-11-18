export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image?: string | null;
  tags: string[];
  status: PostStatus;
  created_at: string;
  updated_at: string;
}