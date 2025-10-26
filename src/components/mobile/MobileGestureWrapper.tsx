import React, { useRef, useState } from 'react';

interface MobileGestureWrapperProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => Promise<void>;
  enablePullToRefresh?: boolean;
  swipeThreshold?: number;
  className?: string;
}

export const MobileGestureWrapper: React.FC<MobileGestureWrapperProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  enablePullToRefresh = false,
  swipeThreshold = 50,
  className = '',
}) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStart.current.y;

    // Pull to refresh
    if (
      enablePullToRefresh &&
      onPullToRefresh &&
      deltaY > 0 &&
      window.scrollY === 0
    ) {
      e.preventDefault();
      const distance = Math.min(deltaY, 150);
      setPullDistance(distance);
      setIsPulling(distance > 80);
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEnd.x - touchStart.current.x;
    const deltaY = touchEnd.y - touchStart.current.y;

    // Pull to refresh
    if (isPulling && onPullToRefresh) {
      try {
        await onPullToRefresh();
      } finally {
        setIsPulling(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    // Determine swipe direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    touchStart.current = null;
  };

  const refreshOpacity = Math.min(pullDistance / 80, 1);
  const refreshRotation = (pullDistance / 150) * 360;

  return (
    <div
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {enablePullToRefresh && pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all"
          style={{
            height: `${pullDistance}px`,
            opacity: refreshOpacity,
          }}
        >
          <div
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            style={{
              transform: `rotate(${refreshRotation}deg)`,
            }}
          />
        </div>
      )}

      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};
