/**
 * FAQ & Knowledge Base Service
 * Handles FAQ items, video tutorials, and community guidelines
 */

import { supabase } from '@/integrations/supabase/client';

// ==================== TYPES (from database) ====================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number | null;
  is_published: boolean | null;
  views_count: number | null;
  helpful_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category: string;
  difficulty_level: string | null;
  order_index: number | null;
  views_count: number | null;
  is_published: boolean | null;
  created_at: string | null;
}

export interface CommunityGuidelines {
  id: string;
  version: string;
  content_nl: string;
  content_en: string;
  content_ar: string;
  is_current: boolean | null;
  published_at: string | null;
  created_at: string | null;
}

export type FAQCategory = 'account' | 'billing' | 'learning' | 'technical' | 'community';

export interface KBSearchQuery {
  query: string;
  category?: FAQCategory;
  limit?: number;
}

// ==================== FAQ ITEMS ====================

export const getFAQItems = async (): Promise<FAQItem[]> => {
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getFAQByCategory = async (category: FAQCategory): Promise<FAQItem[]> => {
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_published', true)
    .eq('category', category)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getFAQCategories = async (): Promise<{ category: FAQCategory; count: number }[]> => {
  const { data, error } = await supabase
    .from('faq_items')
    .select('category')
    .eq('is_published', true);

  if (error) throw error;

  const counts: Record<string, number> = {};
  data?.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });

  return Object.entries(counts).map(([category, count]) => ({
    category: category as FAQCategory,
    count,
  }));
};

export const searchFAQ = async (query: KBSearchQuery): Promise<FAQItem[]> => {
  let queryBuilder = supabase
    .from('faq_items')
    .select('*')
    .eq('is_published', true)
    .or(`question.ilike.%${query.query}%,answer.ilike.%${query.query}%`);

  if (query.category) {
    queryBuilder = queryBuilder.eq('category', query.category);
  }

  const { data, error } = await queryBuilder
    .order('views_count', { ascending: false })
    .limit(query.limit || 10);

  if (error) throw error;
  return data || [];
};

export const incrementFAQViews = async (id: string): Promise<void> => {
  // Get current count and increment
  const { data: current } = await supabase
    .from('faq_items')
    .select('views_count')
    .eq('id', id)
    .single();

  await supabase
    .from('faq_items')
    .update({ views_count: (current?.views_count || 0) + 1 })
    .eq('id', id);
};

export const markFAQHelpful = async (id: string): Promise<void> => {
  // Simple increment - in production, track per user
  const { data: current } = await supabase
    .from('faq_items')
    .select('helpful_count')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('faq_items')
    .update({ helpful_count: (current?.helpful_count || 0) + 1 })
    .eq('id', id);

  if (error) throw error;
};

// ==================== VIDEO TUTORIALS ====================

export const getVideoTutorials = async (): Promise<VideoTutorial[]> => {
  const { data, error } = await supabase
    .from('video_tutorials')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getVideosByCategory = async (category: string): Promise<VideoTutorial[]> => {
  const { data, error } = await supabase
    .from('video_tutorials')
    .select('*')
    .eq('is_published', true)
    .eq('category', category)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getVideoById = async (id: string): Promise<VideoTutorial | null> => {
  const { data, error } = await supabase
    .from('video_tutorials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const incrementVideoViews = async (id: string): Promise<void> => {
  const { data: current } = await supabase
    .from('video_tutorials')
    .select('views_count')
    .eq('id', id)
    .single();

  await supabase
    .from('video_tutorials')
    .update({ views_count: (current?.views_count || 0) + 1 })
    .eq('id', id);
};

export const getVideoCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('video_tutorials')
    .select('category')
    .eq('is_published', true);

  if (error) throw error;

  const uniqueCategories = [...new Set(data?.map(v => v.category) || [])];
  return uniqueCategories;
};

// ==================== COMMUNITY GUIDELINES ====================

export const getCurrentGuidelines = async (): Promise<CommunityGuidelines | null> => {
  const { data, error } = await supabase
    .from('community_guidelines')
    .select('*')
    .eq('is_current', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const getGuidelinesContent = async (lang: 'nl' | 'en' | 'ar' = 'nl'): Promise<string> => {
  const guidelines = await getCurrentGuidelines();
  if (!guidelines) return '';

  switch (lang) {
    case 'en':
      return guidelines.content_en;
    case 'ar':
      return guidelines.content_ar;
    default:
      return guidelines.content_nl;
  }
};

// ==================== UNIFIED SEARCH ====================

export const searchKnowledgeBase = async (query: string): Promise<{
  faqs: FAQItem[];
  videos: VideoTutorial[];
}> => {
  const [faqResults, videoResults] = await Promise.all([
    searchFAQ({ query, limit: 5 }),
    supabase
      .from('video_tutorials')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5),
  ]);

  return {
    faqs: faqResults,
    videos: videoResults.data || [],
  };
};

// ==================== HELPER FUNCTIONS ====================

export const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getCategoryLabel = (category: FAQCategory, lang: 'nl' | 'en' = 'nl'): string => {
  const labels: Record<FAQCategory, Record<string, string>> = {
    account: { nl: 'Account', en: 'Account' },
    billing: { nl: 'Betalingen', en: 'Billing' },
    learning: { nl: 'Leren', en: 'Learning' },
    technical: { nl: 'Technisch', en: 'Technical' },
    community: { nl: 'Community', en: 'Community' },
  };
  return labels[category]?.[lang] || category;
};

export const getCategoryIcon = (category: FAQCategory): string => {
  const icons: Record<FAQCategory, string> = {
    account: '👤',
    billing: '💳',
    learning: '📚',
    technical: '🔧',
    community: '👥',
  };
  return icons[category] || '❓';
};
