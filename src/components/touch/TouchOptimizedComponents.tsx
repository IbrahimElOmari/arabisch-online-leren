import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useMobileRTL } from '@/hooks/useMobileRTL';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Touch-optimized button with haptic feedback simulation
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'touch';
  size?: 'default' | 'sm' | 'lg' | 'touch';
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, variant = 'default', size = 'default', hapticFeedback = true, children, onClick, ...props }, ref) => {
    const [isPressed, setIsPressed] = useState(false);
    const { getTouchClasses } = useMobileRTL();
    const { isRTL } = useRTLLayout();

    const handleTouchStart = useCallback(() => {
      setIsPressed(true);
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10); // Light haptic feedback
      }
    }, [hapticFeedback]);

    const handleTouchEnd = useCallback(() => {
      setIsPressed(false);
    }, []);

    const touchSizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      touch: 'h-12 px-6 py-3 text-base' // Optimized for touch
    };

    return (
      <Button
        ref={ref}
        variant={variant === 'touch' ? 'default' : variant}
        className={cn(
          "transition-all duration-150 select-none",
          "active:scale-95 focus:scale-105", // Touch feedback
          size === 'touch' && touchSizeClasses.touch,
          isPressed && "scale-95",
          getTouchClasses(),
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={onClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

// Touch-optimized card with swipe gestures
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  swipeThreshold?: number;
}

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  swipeThreshold = 100
}: SwipeableCardProps) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const { isRTL } = useRTLLayout();

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    const deltaX = currentX - startX;
    const absDistance = Math.abs(deltaX);
    
    if (absDistance > swipeThreshold) {
      if (deltaX > 0) {
        // Swiped right
        if (isRTL) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      } else {
        // Swiped left
        if (isRTL) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    }
    
    setIsSwiping(false);
    setCurrentX(0);
    setStartX(0);
  };

  const transformX = isSwiping ? currentX - startX : 0;

  return (
    <Card
      className={cn(
        "touch-card cursor-pointer select-none transition-transform duration-200",
        "active:scale-98 hover:shadow-md",
        className
      )}
      style={{
        transform: `translateX(${transformX}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </Card>
  );
};

// Pull-to-refresh component for mobile
interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  refreshThreshold?: number;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className,
  refreshThreshold = 80
}: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, refreshThreshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setStartY(0);
  };

  const pullProgress = Math.min(pullDistance / refreshThreshold, 1);
  const opacity = Math.min(pullProgress, 0.8);

  return (
    <div 
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full",
          "flex items-center justify-center transition-transform duration-200",
          "bg-background border border-border rounded-full w-12 h-12 z-10"
        )}
        style={{
          opacity: isPulling ? opacity : 0,
          transform: `translateX(-50%) translateY(${isPulling ? pullDistance - 48 : -48}px)`,
        }}
      >
        <div 
          className={cn(
            "w-6 h-6 border-2 border-primary rounded-full transition-transform duration-200",
            isRefreshing && "animate-spin",
            !isRefreshing && pullProgress >= 1 && "rotate-180"
          )}
          style={{
            borderTopColor: 'transparent',
            transform: `rotate(${pullProgress * 360}deg)`
          }}
        />
      </div>
      
      {/* Content */}
      <div 
        style={{
          transform: `translateY(${isPulling ? pullDistance : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Touch-optimized input with better mobile UX
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  touchOptimized?: boolean;
}

export const TouchInput = React.forwardRef<HTMLInputElement, TouchInputProps>(
  ({ className, label, error, touchOptimized = true, ...props }, ref) => {
    const { isRTL } = useRTLLayout();
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-destructive"
          )}>
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          className={cn(
            "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            touchOptimized && "h-12 px-4 text-base", // Better for touch
            !touchOptimized && "h-10 px-3 py-2",
            error && "border-destructive focus-visible:ring-destructive",
            isFocused && touchOptimized && "scale-102 shadow-lg",
            "transition-all duration-200",
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-destructive animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TouchInput.displayName = 'TouchInput';