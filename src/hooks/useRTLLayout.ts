
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

  const getMarginStart = (size: string) => isRTL ? `mr-${size}` : `ml-${size}`;
  const getMarginEnd = (size: string) => isRTL ? `ml-${size}` : `mr-${size}`;
  const getPaddingStart = (size: string) => isRTL ? `pr-${size}` : `pl-${size}`;
  const getPaddingEnd = (size: string) => isRTL ? `pl-${size}` : `pr-${size}`;

  const getBorderStart = () => isRTL ? 'border-r' : 'border-l';
  const getBorderEnd = () => isRTL ? 'border-l' : 'border-r';

  const getRoundedStart = (size: string = '') => isRTL ? `rounded-r${size ? '-' + size : ''}` : `rounded-l${size ? '-' + size : ''}`;
  const getRoundedEnd = (size: string = '') => isRTL ? `rounded-l${size ? '-' + size : ''}` : `rounded-r${size ? '-' + size : ''}`;

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
  };
};
