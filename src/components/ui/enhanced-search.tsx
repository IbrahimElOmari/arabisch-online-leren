import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface SortOption {
  id: string;
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}

interface EnhancedSearchProps {
  placeholder?: string;
  value?: string;
  onSearchChange: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
  onSortChange?: (sortBy: string, direction: 'asc' | 'desc') => void;
  filters?: SearchFilter[];
  sortOptions?: SortOption[];
  activeFilters?: string[];
  activeSortBy?: string;
  activeSortDirection?: 'asc' | 'desc';
  isLoading?: boolean;
  resultsCount?: number;
  className?: string;
  showFilters?: boolean;
  showSort?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancedSearch = ({
  placeholder,
  value = '',
  onSearchChange,
  onFilterChange,
  onSortChange,
  filters = [],
  sortOptions = [],
  activeFilters = [],
  activeSortBy,
  activeSortDirection = 'asc',
  isLoading = false,
  resultsCount,
  className,
  showFilters = true,
  showSort = true,
  size = 'md'
}: EnhancedSearchProps) => {
  const [searchValue, setSearchValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isRTL, getFlexDirection } = useRTLLayout();
  const { t } = useTranslation();
  
  // Debounce search input for better performance
  const debouncedSearchValue = useDebounce(searchValue, 300);
  
  useEffect(() => {
    if (debouncedSearchValue !== value) {
      onSearchChange(debouncedSearchValue);
    }
  }, [debouncedSearchValue, onSearchChange, value]);
  
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleClear = () => {
    setSearchValue('');
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleFilterToggle = (filterId: string) => {
    if (!onFilterChange) return;
    
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(id => id !== filterId)
      : [...activeFilters, filterId];
    
    onFilterChange(newFilters);
  };

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    if (onSortChange) {
      onSortChange(sortBy, direction);
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <div className={cn('w-full space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Input Row */}
      <div className={cn(
        'flex items-center gap-2',
        isRTL && 'flex-row-reverse'
      )}>
        {/* Main Search Input */}
        <div className={cn(
          'relative flex-1',
          isFocused && 'ring-2 ring-primary ring-offset-2 rounded-md'
        )}>
          <div className={cn(
            'absolute inset-y-0 flex items-center pointer-events-none',
            isRTL ? 'right-3' : 'left-3'
          )}>
            {isLoading ? (
              <Loader2 className={cn(iconSizes[size], 'animate-spin text-muted-foreground')} />
            ) : (
              <Search className={cn(iconSizes[size], 'text-muted-foreground')} />
            )}
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || t('search.placeholder', 'Zoeken...')}
            className={cn(
              sizeClasses[size],
              isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10',
              'transition-all duration-200',
              isRTL && 'arabic-text'
            )}
            aria-label={t('search.label', 'Zoeken')}
          />
          
          {searchValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className={cn(
                'absolute inset-y-0 h-full aspect-square',
                isRTL ? 'left-0' : 'right-0',
                'hover:bg-transparent'
              )}
              aria-label={t('search.clear', 'Wissen')}
            >
              <X className={cn(iconSizes[size], 'text-muted-foreground hover:text-foreground')} />
            </Button>
          )}
        </div>

        {/* Filter Button */}
        {showFilters && filters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className={cn(
                  sizeClasses[size], 
                  'aspect-square relative',
                  activeFilters.length > 0 && 'border-primary bg-primary/10'
                )}
                aria-label={t('search.filters', 'Filters')}
              >
                <Filter className={iconSizes[size]} />
                {activeFilters.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
              <DropdownMenuLabel className={isRTL ? 'arabic-text' : ''}>
                {t('search.filter_by', 'Filteren op')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filters.map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={() => handleFilterToggle(filter.id)}
                  className={cn(
                    'flex items-center justify-between cursor-pointer',
                    activeFilters.includes(filter.id) && 'bg-accent'
                  )}
                >
                  <span className={cn('flex-1', isRTL && 'arabic-text')}>
                    {filter.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {filter.count !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {filter.count}
                      </Badge>
                    )}
                    {activeFilters.includes(filter.id) && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Sort Button */}
        {showSort && sortOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className={cn(
                  sizeClasses[size],
                  'aspect-square',
                  activeSortBy && 'border-primary bg-primary/10'
                )}
                aria-label={t('search.sort', 'Sorteren')}
              >
                <ArrowUpDown className={iconSizes[size]} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48">
              <DropdownMenuLabel className={isRTL ? 'arabic-text' : ''}>
                {t('search.sort_by', 'Sorteren op')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={`${option.id}-${option.direction}`}
                  onClick={() => handleSortChange(option.value, option.direction)}
                  className={cn(
                    'cursor-pointer',
                    activeSortBy === option.value && activeSortDirection === option.direction && 'bg-accent'
                  )}
                >
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {option.label} ({option.direction === 'asc' ? '↑' : '↓'})
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Active Filters & Results Count */}
      {(activeFilters.length > 0 || resultsCount !== undefined) && (
        <div className={cn(
          'flex items-center justify-between text-sm text-muted-foreground',
          isRTL && 'flex-row-reverse'
        )}>
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              <span className={isRTL ? 'arabic-text' : ''}>
                {t('search.active_filters', 'Actieve filters')}:
              </span>
              <div className={cn('flex gap-1', isRTL && 'flex-row-reverse')}>
                {activeFilters.map((filterId) => {
                  const filter = filters.find(f => f.id === filterId);
                  return filter ? (
                    <Badge 
                      key={filterId} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleFilterToggle(filterId)}
                    >
                      {filter.label} ×
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Results Count */}
          {resultsCount !== undefined && (
            <span className={isRTL ? 'arabic-text' : ''}>
              {resultsCount} {t('search.results', 'resultaten')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;