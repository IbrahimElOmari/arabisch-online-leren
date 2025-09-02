import { useRTL } from '@/contexts/RTLContext';

export const useRTLAnimations = () => {
  const { isRTL } = useRTL();

  // Slide animations that respect RTL
  const getSlideInAnimation = (direction: 'left' | 'right' = 'left') => {
    if (direction === 'left') {
      return isRTL ? 'animate-slide-in-right' : 'animate-slide-in-left';
    }
    return isRTL ? 'animate-slide-in-left' : 'animate-slide-in-right';
  };

  const getSlideOutAnimation = (direction: 'left' | 'right' = 'left') => {
    if (direction === 'left') {
      return isRTL ? 'animate-slide-out-right' : 'animate-slide-out-left';
    }
    return isRTL ? 'animate-slide-out-left' : 'animate-slide-out-right';
  };

  // Dropdown/Popover positioning classes
  const getDropdownClasses = () => {
    return isRTL ? 'rtl-dropdown' : 'ltr-dropdown';
  };

  // Toast positioning
  const getToastClasses = () => {
    return isRTL ? 'rtl-toast' : 'ltr-toast';
  };

  // Modal slide animations
  const getModalSlideClasses = () => {
    return isRTL ? 'animate-rtl-slide-in' : 'animate-slide-in-left';
  };

  // Icon rotation for RTL
  const getIconTransform = (shouldFlip: boolean = true) => {
    return shouldFlip && isRTL ? 'rtl-flip' : '';
  };

  // Loading state animations
  const getLoadingClasses = () => {
    return isRTL ? 'rtl-fade-enter' : 'animate-fade-in';
  };

  // Bounce animation for notifications
  const getBounceInClasses = () => {
    return 'animate-bounce-in';
  };

  // Pulse glow for focused elements
  const getPulseGlowClasses = () => {
    return 'animate-pulse-glow';
  };

  // Staggered animation delays for lists
  const getStaggerDelay = (index: number, baseDelay: number = 100) => {
    return {
      animationDelay: `${index * baseDelay}ms`
    };
  };

  return {
    isRTL,
    getSlideInAnimation,
    getSlideOutAnimation,
    getDropdownClasses,
    getToastClasses,
    getModalSlideClasses,
    getIconTransform,
    getLoadingClasses,
    getBounceInClasses,
    getPulseGlowClasses,
    getStaggerDelay,
  };
};