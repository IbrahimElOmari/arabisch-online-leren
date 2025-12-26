import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Search result interfaces
export interface SearchResult {
  entity_type: 'forum_thread' | 'forum_post' | 'lesson' | 'task' | 'profile';
  entity_id: string;
  title: string;
  body: string;
  class_id: string | null;
  created_at: string;
  rank: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  classId?: string | null;
  entityType?: SearchResult['entity_type'];
}

// Validation schema
const searchSchema = z.object({
  query: z.string().min(1, 'Zoekterm mag niet leeg zijn').max(100, 'Zoekterm te lang'),
  limit: z.number().min(1).max(50).optional(),
  offset: z.number().min(0).optional(),
  classId: z.string().uuid().nullable().optional(),
});

export class SearchService {
  /**
   * Global search using full-text search with RLS awareness
   */
  static async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<{ results: SearchResult[]; hasMore: boolean }> {
    const validated = searchSchema.parse({ 
      query: query.trim(), 
      ...options 
    });

    const limit = options.limit || 20;
    const offset = options.offset || 0;

    try {
      // Use the RPC function for full-text search
      const { data, error } = await supabase.rpc('search_global', {
        p_query: validated.query,
        p_limit: limit + 1,
        p_offset: offset,
        p_class_id: options.classId ?? null
      } as any);

      if (error) throw error;

      const hasMore = data && data.length > limit;
      const results = hasMore ? data.slice(0, limit) : (data || []);

      // Filter by entity type if specified
      let filteredResults = results;
      if (options.entityType) {
        filteredResults = results.filter(r => r.entity_type === options.entityType);
      }

      return {
        results: filteredResults as SearchResult[],
        hasMore: hasMore && filteredResults.length === limit
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Search error:', error);
      
      // Fallback to simple ILIKE search if full-text search fails
      return this.fallbackSearch(validated.query, options);
    }
  }

  /**
   * Fallback search using ILIKE when full-text search is unavailable
   */
  private static async fallbackSearch(
    query: string, 
    options: SearchOptions
  ): Promise<{ results: SearchResult[]; hasMore: boolean }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const searchPattern = `%${query}%`;

    const searchPromises = [];

    // Search forum threads
    if (!options.entityType || options.entityType === 'forum_thread') {
      searchPromises.push(
        supabase
          .from('forum_threads')
          .select('id, title, body, class_id, created_at')
          .or(`title.ilike.${searchPattern},body.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    }

    // Search forum posts
    if (!options.entityType || options.entityType === 'forum_post') {
      searchPromises.push(
        supabase
          .from('forum_posts')
          .select('id, titel, body, class_id, created_at')
          .or(`titel.ilike.${searchPattern},body.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    }

    // Search lessons
    if (!options.entityType || options.entityType === 'lesson') {
      searchPromises.push(
        supabase
          .from('lessen')
          .select('id, title, class_id, created_at')
          .ilike('title', searchPattern)
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    }

    // Search tasks
    if (!options.entityType || options.entityType === 'task') {
      searchPromises.push(
        supabase
          .from('tasks')
          .select('id, title, description, created_at, level_id')
          .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    }

    // Search profiles
    if (!options.entityType || options.entityType === 'profile') {
      searchPromises.push(
        supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .ilike('full_name', searchPattern)
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    }

    const responses = await Promise.allSettled(searchPromises);
    const results: SearchResult[] = [];

    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value.data) {
        const entityTypes: SearchResult['entity_type'][] = [
          'forum_thread', 'forum_post', 'lesson', 'task', 'profile'
        ];
        
        response.value.data.forEach((item: any) => {
          let result: SearchResult;
          
          switch (entityTypes[index]) {
            case 'forum_thread':
              result = {
                entity_type: 'forum_thread',
                entity_id: item.id,
                title: item.title || '',
                body: item.body || '',
                class_id: item.class_id || null,
                created_at: item.created_at,
                rank: 0.5
              };
              break;
              
            case 'forum_post':
              result = {
                entity_type: 'forum_post',
                entity_id: item.id,
                title: item.titel || item.title || '',
                body: item.body || '',
                class_id: item.class_id || null,
                created_at: item.created_at,
                rank: 0.5
              };
              break;
              
            case 'lesson':
              result = {
                entity_type: 'lesson',
                entity_id: item.id,
                title: item.title || '',
                body: '',
                class_id: item.class_id || null,
                created_at: item.created_at,
                rank: 0.5
              };
              break;
              
            case 'task':
              result = {
                entity_type: 'task',
                entity_id: item.id,
                title: item.title || '',
                body: item.description || '',
                class_id: null,
                created_at: item.created_at,
                rank: 0.5
              };
              break;
              
            case 'profile':
              result = {
                entity_type: 'profile',
                entity_id: item.id,
                title: item.full_name || '',
                body: '',
                class_id: null,
                created_at: item.created_at,
                rank: 0.5
              };
              break;
              
            default:
              return;
          }
          
          results.push(result);
        });
      }
    });

    // Sort by created_at descending
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      results: results.slice(offset, offset + limit),
      hasMore: results.length > offset + limit
    };
  }

  /**
   * Get search suggestions based on recent searches or popular terms
   */
  static async getSuggestions(partial: string): Promise<string[]> {
    if (partial.length < 2) return [];

    try {
      // Get recent search terms from popular content titles
      const { data: suggestions } = await supabase
        .from('global_search_index')
        .select('title')
        .ilike('title', `%${partial}%`)
        .limit(10);

      return suggestions?.map(s => s.title).filter((title): title is string => title !== null && title !== undefined) || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  /**
   * Get entity URL for navigation
   */
  static getEntityUrl(result: SearchResult): string {
    switch (result.entity_type) {
      case 'forum_thread':
        return `/forum/thread/${result.entity_id}`;
      case 'forum_post':
        return `/forum/post/${result.entity_id}`;
      case 'lesson':
        return `/leerstof/lesson/${result.entity_id}`;
      case 'task':
        return `/taken/task/${result.entity_id}`;
      case 'profile':
        return `/profile/${result.entity_id}`;
      default:
        return '/';
    }
  }

  /**
   * Get display name for entity type
   */
  static getEntityTypeLabel(entityType: SearchResult['entity_type']): string {
    const labels = {
      forum_thread: 'Forum discussie',
      forum_post: 'Forum bericht',
      lesson: 'Les',
      task: 'Opdracht',
      profile: 'Gebruiker'
    };
    
    return labels[entityType] || entityType;
  }
}