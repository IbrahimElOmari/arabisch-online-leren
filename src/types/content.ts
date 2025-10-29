/**
 * Type definitions for Content Management (F1)
 */

export interface ContentVersion {
  id: string;
  content_type: 'lesson' | 'question' | 'task' | 'forum_post';
  content_id: string;
  version_number: number;
  content_data: Record<string, any>;
  created_by: string | null;
  created_at: string;
  change_summary: string | null;
  is_published: boolean;
}

export interface MediaItem {
  id: string;
  filename: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_size: number;
  mime_type: string;
  thumbnail_url: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  tags: string[];
  alt_text: string | null;
  usage_count: number;
}

export interface ContentTemplate {
  id: string;
  template_name: string;
  template_type: 'lesson' | 'question' | 'assignment' | 'forum_thread';
  template_data: Record<string, any>;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  usage_count: number;
}

export interface RichTextEditorContent {
  type: 'doc';
  content: Array<{
    type: string;
    attrs?: Record<string, any>;
    content?: any[];
    marks?: Array<{
      type: string;
      attrs?: Record<string, any>;
    }>;
    text?: string;
  }>;
}
