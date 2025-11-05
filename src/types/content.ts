import type { Json } from '@/integrations/supabase/types';

export type ContentType = 
  | 'prep_lesson' 
  | 'live_lesson' 
  | 'assignment' 
  | 'custom';

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ContentLibrary {
  id: string;
  content_type: string;
  title: string;
  content_data: Json;
  status: string;
  module_id?: string | null;
  level_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  published_at?: string | null;
  version: number;
  parent_version_id?: string | null;
  tags?: string[] | null;
  metadata?: Json;
  created_at: string;
  updated_at: string;
  owner_id?: string | null;
}

export interface ContentTemplate {
  id: string;
  template_type: string;
  template_name: string;
  template_data: Json;
  is_public: boolean | null;
  created_by?: string | null;
  created_at: string | null;
  usage_count: number | null;
  owner_id?: string | null;
}

export interface ContentVersion {
  id: string;
  content_id: string;
  content_type: string;
  version_number: number;
  content_data: Json;
  created_by?: string | null;
  created_at: string | null;
  change_summary?: string | null;
  is_published: boolean | null;
}

export interface MediaLibraryItem {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string | null;
  created_at: string;
  tags?: string[] | null;
  alt_text?: string | null;
  width?: number | null;
  height?: number | null;
}