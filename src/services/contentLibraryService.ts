import { supabase } from '@/integrations/supabase/client';
import type { ContentLibrary, ContentTemplate, ContentVersion, MediaLibraryItem } from '@/types/content';

export const contentLibraryService = {
  // Content CRUD
  async listContent(filters?: {
    module_id?: string;
    level_id?: string;
    content_type?: string;
    status?: string;
  }): Promise<ContentLibrary[]> {
    let query = supabase
      .from('content_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.module_id) query = query.eq('module_id', filters.module_id);
    if (filters?.level_id) query = query.eq('level_id', filters.level_id);
    if (filters?.content_type) query = query.eq('content_type', filters.content_type);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getContent(id: string): Promise<ContentLibrary | null> {
    const { data, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async saveContent(content: Partial<ContentLibrary>): Promise<ContentLibrary> {
    const { data, error } = await supabase.functions.invoke('content-save', {
      body: content
    });

    if (error) {
      throw new Error(error.message || 'Failed to save content');
    }

    return data.content;
  },

  async publishContent(contentId: string): Promise<ContentLibrary> {
    const { data, error } = await supabase.functions.invoke('content-publish', {
      body: { content_id: contentId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to publish content');
    }

    return data.content;
  },

  async deleteContent(id: string): Promise<void> {
    const { error } = await supabase
      .from('content_library')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Templates
  async listTemplates(type?: string): Promise<ContentTemplate[]> {
    let query = supabase
      .from('content_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (type) {
      query = query.eq('template_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTemplate(id: string): Promise<ContentTemplate | null> {
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createTemplate(template: Partial<ContentTemplate>): Promise<ContentTemplate> {
    const { data, error } = await supabase
      .from('content_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(id: string, updates: Partial<ContentTemplate>): Promise<ContentTemplate> {
    const { data, error } = await supabase
      .from('content_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('content_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Version History
  async listVersions(contentId: string): Promise<ContentVersion[]> {
    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('content_id', contentId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getVersion(id: string): Promise<ContentVersion | null> {
    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async rollbackToVersion(contentId: string, versionId: string): Promise<ContentLibrary> {
    const version = await this.getVersion(versionId);
    if (!version) throw new Error('Version not found');

    return await this.saveContent({
      id: contentId,
      content_data: version.content_data,
      parent_version_id: versionId
    });
  },

  // Media Library
  async uploadMedia(file: File, altText?: string, tags?: string[]): Promise<MediaLibraryItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('alt_text', altText);
    if (tags) formData.append('tags', JSON.stringify(tags));

    const { data, error } = await supabase.functions.invoke('media-upload', {
      body: formData
    });

    if (error) {
      throw new Error(error.message || 'Failed to upload media');
    }

    return data.media;
  },

  async listMedia(filters?: {
    file_type?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ items: MediaLibraryItem[]; total: number }> {
    const { data, error } = await supabase.functions.invoke('media-list', {
      body: filters || {}
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch media');
    }

    return {
      items: data.items || [],
      total: data.total || 0
    };
  }
};