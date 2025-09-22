import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Filter, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchService, type SearchResult } from '@/services/searchService';
import { NoSearchResultsEmptyState } from '@/components/ui/enhanced-empty-states';
import { EnhancedSkeleton } from '@/components/ui/enhanced-loading-states';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { Link } from 'react-router-dom';

interface GlobalSearchProps {
  trigger?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({ 
  trigger, 
  placeholder = "Zoek in alles... (Cmd+K)",
  className 
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SearchResult['entity_type'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isRTL } = useRTLLayout();
  const debouncedQuery = useDebounce(query, 300);

  // Search query
  const { 
    data: searchData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['search', debouncedQuery, selectedType, page],
    queryFn: () => SearchService.search(debouncedQuery, {
      limit: 20,
      offset: (page - 1) * 20,
      entityType: selectedType === 'all' ? undefined : selectedType
    }),
    enabled: debouncedQuery.length >= 2,
  });

  const results = searchData?.results || [];
  const hasMore = searchData?.hasMore || false;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleResultClick = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setPage(1);
  }, []);

  const entityTypes = [
    { value: 'all' as const, label: 'Alles' },
    { value: 'forum_thread' as const, label: 'Discussies' },
    { value: 'forum_post' as const, label: 'Berichten' },
    { value: 'lesson' as const, label: 'Lessen' },
    { value: 'task' as const, label: 'Opdrachten' },
    { value: 'profile' as const, label: 'Gebruikers' },
  ];

  const renderSearchResult = (result: SearchResult) => {
    const url = SearchService.getEntityUrl(result);
    const typeLabel = SearchService.getEntityTypeLabel(result.entity_type);
    
    return (
      <Link
        key={`${result.entity_type}-${result.entity_id}`}
        to={url}
        onClick={() => handleResultClick(result)}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg transition-colors",
          "hover:bg-accent cursor-pointer group"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium line-clamp-1 group-hover:text-primary",
              isRTL && "arabic-text"
            )}>
              {result.title}
            </h4>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          
          {result.body && (
            <p className={cn(
              "text-sm text-muted-foreground line-clamp-2 mt-1",
              isRTL && "arabic-text"
            )}>
              {result.body}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {typeLabel}
            </Badge>
            
            {result.rank > 0 && (
              <span className="text-xs text-muted-foreground">
                Relevantie: {Math.round(result.rank * 100)}%
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  const defaultTrigger = (
    <Button variant="outline" className={cn("justify-start", className)}>
      <Search className="h-4 w-4 mr-2" />
      <span className="flex-1 text-left text-muted-foreground">
        {placeholder}
      </span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-2xl p-0 gap-0"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className={cn(isRTL && "arabic-text")}>
            Globaal zoeken
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "pl-10 pr-10",
                isRTL && "text-right arabic-text"
              )}
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {entityTypes.find(t => t.value === selectedType)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"}>
              {entityTypes.map((type) => (
                <DropdownMenuItem
                  key={type.value}
                  onClick={() => {
                    setSelectedType(type.value);
                    setPage(1);
                  }}
                >
                  {type.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-96 px-4 pb-4">
          {debouncedQuery.length < 2 ? (
            <div className="text-center text-muted-foreground py-8">
              Typ minimaal 2 karakters om te zoeken
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <div className="flex-1 space-y-2">
                    <EnhancedSkeleton className="h-4 w-3/4" />
                    <EnhancedSkeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <EnhancedSkeleton className="h-5 w-16" />
                      <EnhancedSkeleton className="h-5 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8">
              Fout bij zoeken. Probeer het opnieuw.
            </div>
          ) : results.length === 0 ? (
            <NoSearchResultsEmptyState 
              searchQuery={debouncedQuery}
              onClearSearch={handleClearSearch}
            />
          ) : (
            <div className="space-y-1">
              {results.map(renderSearchResult)}
              
              {hasMore && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    Meer resultaten laden
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer with shortcuts */}
        <div className="border-t p-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              Gebruik ↑↓ om te navigeren, ↵ om te selecteren
            </span>
            <div className="flex items-center gap-4">
              <span>Totaal: {results.length} resultaten</span>
              <span>ESC om te sluiten</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}