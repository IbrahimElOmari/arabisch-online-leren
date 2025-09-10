import { useRTL } from '@/contexts/RTLContext';
import { useEffect, useState } from 'react';
import { initializeCrossBrowserRTL } from '@/utils/crossBrowserRTL';

export const useMobileRTL = () => {
  const { isRTL } = useRTL();
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTouch('ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Initialize cross-browser RTL support for mobile
    if (isMobile) {
      initializeCrossBrowserRTL();
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Mobile-specific RTL utilities
  const getMobileSwipeDirection = () => isRTL ? 'swipe-rtl' : 'swipe-ltr';
  
  const getMobileNavClasses = () => {
    if (!isMobile) return '';
    return isRTL ? 'mobile-nav-rtl' : 'mobile-nav-ltr';
  };

  const getTouchClasses = () => {
    if (!isTouch) return '';
    return isRTL ? 'touch-rtl' : 'touch-ltr';
  };

  const getMobileModalClasses = () => {
    if (!isMobile) return '';
    return isRTL ? 'mobile-modal-rtl animate-slide-in-right' : 'mobile-modal-ltr animate-slide-in-left';
  };

  const getMobileDropdownClasses = () => {
    if (!isMobile) return '';
    return isRTL ? 'mobile-dropdown-rtl' : 'mobile-dropdown-ltr';
  };

  // Mobile responsiveness breakpoints
  const getResponsiveClasses = (baseClass: string) => {
    const mobileSuffix = isMobile ? '-mobile' : '';
    const rtlSuffix = isRTL ? '-rtl' : '';
    return `${baseClass}${mobileSuffix}${rtlSuffix}`;
  };

  // Mobile-specific animations
  const getMobileAnimationDelay = (index: number) => ({
    animationDelay: `${index * 50}ms`
  });

  return {
    isRTL,
    isMobile,
    isTouch,
    getMobileSwipeDirection,
    getMobileNavClasses,
    getTouchClasses,
    getMobileModalClasses,
    getMobileDropdownClasses,
    getResponsiveClasses,
    getMobileAnimationDelay,
  };
};