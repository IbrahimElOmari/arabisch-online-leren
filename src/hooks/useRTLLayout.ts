
import { useRTL } from '@/contexts/RTLContext';

export const useRTLLayout = () => {
  const { isRTL } = useRTL();

  const getFlexDirection = (defaultDirection: 'row' | 'col' = 'row') => {
    if (defaultDirection === 'col') return 'flex-col';
    return isRTL ? 'flex-row-reverse' : 'flex-row';
  };

  const getTextAlign = (defaultAlign: 'left' | 'right' | 'center' = 'left') => {
    if (defaultAlign === 'center') return 'text-center';
    if (defaultAlign === 'left') return isRTL ? 'text-right' : 'text-left';
    return isRTL ? 'text-left' : 'text-right';
  };

  const getMarginStart = (size: string) => isRTL ? `me-${size}` : `ms-${size}`;
  const getMarginEnd = (size: string) => isRTL ? `ms-${size}` : `me-${size}`;
  const getPaddingStart = (size: string) => isRTL ? `pe-${size}` : `ps-${size}`;
  const getPaddingEnd = (size: string) => isRTL ? `ps-${size}` : `pe-${size}`;

  const getBorderStart = () => isRTL ? 'border-r' : 'border-l';
  const getBorderEnd = () => isRTL ? 'border-l' : 'border-r';

  const getRoundedStart = (size: string = '') => isRTL ? `rounded-r${size ? '-' + size : ''}` : `rounded-l${size ? '-' + size : ''}`;
  const getRoundedEnd = (size: string = '') => isRTL ? `rounded-l${size ? '-' + size : ''}` : `rounded-r${size ? '-' + size : ''}`;

  // Advanced layout utilities
  const getGridDirection = () => isRTL ? 'grid-flow-row-dense' : 'grid-flow-row';
  const getJustifyContent = (defaultJustify: 'start' | 'end' | 'center' = 'start') => {
    if (defaultJustify === 'center') return 'justify-center';
    if (defaultJustify === 'start') return isRTL ? 'justify-end' : 'justify-start';
    return isRTL ? 'justify-start' : 'justify-end';
  };

  const getItemsAlign = (defaultAlign: 'start' | 'end' | 'center' = 'start') => {
    if (defaultAlign === 'center') return 'items-center';
    if (defaultAlign === 'start') return isRTL ? 'items-end' : 'items-start';
    return isRTL ? 'items-start' : 'items-end';
  };

  // Icon and content utilities  
  const getIconSpacing = (size: string = '2') => isRTL ? `ms-${size}` : `me-${size}`;
  const getIconSpacingReverse = (size: string = '2') => isRTL ? `me-${size}` : `ms-${size}`;

  // Position utilities
  const getLeftPosition = (size: string) => isRTL ? `right-${size}` : `left-${size}`;
  const getRightPosition = (size: string) => isRTL ? `left-${size}` : `right-${size}`;

  // Transform utilities for animations
  const getTransformDirection = () => isRTL ? 'scale-x-[-1]' : '';
  const getSlideDirection = (direction: 'in' | 'out' = 'in') => {
    if (direction === 'in') {
      return isRTL ? 'translate-x-full' : '-translate-x-full';
    }
    return isRTL ? '-translate-x-full' : 'translate-x-full';
  };

  // Advanced spacing utilities
  const getSpaceX = (size: string) => isRTL ? `space-x-reverse space-x-${size}` : `space-x-${size}`;
  const getDivideX = (size: string = '') => isRTL ? `divide-x-reverse ${size ? `divide-x-${size}` : 'divide-x'}` : size ? `divide-x-${size}` : 'divide-x';

  return {
    isRTL,
    getFlexDirection,
    getTextAlign,
    getMarginStart,
    getMarginEnd,
    getPaddingStart,
    getPaddingEnd,
    getBorderStart,
    getBorderEnd,
    getRoundedStart,
    getRoundedEnd,
    getGridDirection,
    getJustifyContent,
    getItemsAlign,
    getIconSpacing,
    getIconSpacingReverse,
    getLeftPosition,
    getRightPosition,
    getTransformDirection,
    getSlideDirection,
    getSpaceX,
    getDivideX,
  };
};
