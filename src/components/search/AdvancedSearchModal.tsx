import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'lesson' | 'task' | 'forum' | 'user';
  title: string;
  description?: string;
  relevance: number;
}

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  React.useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, activeTab]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search would use proper search index in production
      // Simplified for demo purposes
      if (activeTab === 'all' || activeTab === 'lessons') {
        searchResults.push({
          id: '1',
          type: 'lesson',
          title: 'Arabic Lesson 1',
          description: 'Introduction to Arabic',
          relevance: 100
        });
      }

      // Search tasks
      if (activeTab === 'all' || activeTab === 'tasks') {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, description')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        if (tasks) {
          searchResults.push(
            ...tasks.map((t) => ({
              id: t.id,
              type: 'task' as const,
              title: t.title,
              description: t.description || undefined,
              relevance: calculateRelevance(searchQuery, t.title, t.description),
            }))
          );
        }
      }

      // Search forum threads
      if (activeTab === 'all' || activeTab === 'forum') {
        const { data: threads } = await supabase
          .from('forum_threads')
          .select('id, title, body')
          .or(`title.ilike.%${searchQuery}%,body.ilike.%${searchQuery}%`)
          .limit(5);

        if (threads) {
          searchResults.push(
            ...threads.map((thread) => ({
              id: thread.id,
              type: 'forum' as const,
              title: thread.title,
              description: thread.body?.substring(0, 100),
              relevance: calculateRelevance(searchQuery, thread.title, thread.body),
            }))
          );
        }
      }

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance);
      setResults(searchResults);

      // Save to recent searches
      saveRecentSearch(searchQuery);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateRelevance = (
    query: string,
    title: string,
    description?: string | null
  ): number => {
    const lowerQuery = query.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description?.toLowerCase() || '';

    let score = 0;

    // Title exact match
    if (lowerTitle === lowerQuery) score += 100;
    // Title starts with query
    else if (lowerTitle.startsWith(lowerQuery)) score += 50;
    // Title contains query
    else if (lowerTitle.includes(lowerQuery)) score += 25;

    // Description contains query
    if (lowerDesc.includes(lowerQuery)) score += 10;

    return score;
  };

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'lesson':
        return '📚';
      case 'task':
        return '✏️';
      case 'forum':
        return '💬';
      case 'user':
        return '👤';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t('search.advanced.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.advanced.placeholder')}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">{t('search.tabs.all')}</TabsTrigger>
              <TabsTrigger value="lessons">{t('search.tabs.lessons')}</TabsTrigger>
              <TabsTrigger value="tasks">{t('search.tabs.tasks')}</TabsTrigger>
              <TabsTrigger value="forum">{t('search.tabs.forum')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {t('search.recentSearches')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => setQuery(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('search.searching')}
                </div>
              )}

              {!isSearching && query && results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('search.noResults')}
                </div>
              )}

              {!isSearching && results.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        // Navigate to result
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getResultIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{result.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {t(`search.types.${result.type}`)}
                            </Badge>
                          </div>
                          {result.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
