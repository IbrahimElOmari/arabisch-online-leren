import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
  className?: string;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * VirtualizedList - Renders only visible items for performance
 * 
 * Use for large lists (50+ items) like student lists, forum posts, leaderboards
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 400,
  className,
  overscan = 5,
  getItemKey,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  
  // Calculate visible range with overscan
  const { startIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end),
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        container.scrollTop = Math.min(
          container.scrollTop + itemHeight,
          totalHeight - containerHeight
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        container.scrollTop = Math.max(container.scrollTop - itemHeight, 0);
        break;
      case 'PageDown':
        e.preventDefault();
        container.scrollTop = Math.min(
          container.scrollTop + containerHeight,
          totalHeight - containerHeight
        );
        break;
      case 'PageUp':
        e.preventDefault();
        container.scrollTop = Math.max(container.scrollTop - containerHeight, 0);
        break;
      case 'Home':
        e.preventDefault();
        container.scrollTop = 0;
        break;
      case 'End':
        e.preventDefault();
        container.scrollTop = totalHeight - containerHeight;
        break;
    }
  }, [itemHeight, totalHeight, containerHeight]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}
      style={{ height: containerHeight }}
      role="list"
      aria-rowcount={items.length}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div 
        style={{ 
          height: totalHeight, 
          position: 'relative',
          willChange: 'transform',
        }}
      >
        {visibleItems.map((item, localIndex) => {
          const actualIndex = startIndex + localIndex;
          const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
          
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                height: itemHeight,
                width: '100%',
                contain: 'layout style paint',
              }}
              role="listitem"
              aria-rowindex={actualIndex + 1}
              aria-posinset={actualIndex + 1}
              aria-setsize={items.length}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedList;
