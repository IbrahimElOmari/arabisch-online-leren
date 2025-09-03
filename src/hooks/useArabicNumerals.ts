/**
 * Hook for handling Arabic numerals conversion in RTL mode
 * Automatically converts numbers to Arabic numerals when in RTL mode
 */

import { useRTL } from '@/contexts/RTLContext';
import { toArabicNumerals, formatArabicDate, formatArabicTime, formatArabicPercentage } from '@/utils/arabicUtils';

export const useArabicNumerals = () => {
  const { isRTL } = useRTL();

  /**
   * Format number based on current language direction
   */
  const formatNumber = (num: number | string): string => {
    const numStr = typeof num === 'number' ? num.toString() : num;
    return isRTL ? toArabicNumerals(numStr) : numStr;
  };

  /**
   * Format percentage based on current language direction
   */
  const formatPercentage = (value: number): string => {
    return isRTL ? formatArabicPercentage(value) : `${Math.round(value)}%`;
  };

  /**
   * Format date based on current language direction
   */
  const formatDate = (date: Date): string => {
    if (isRTL) {
      return formatArabicDate(date);
    }
    // Dutch date format
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  /**
   * Format time based on current language direction
   */
  const formatTime = (date: Date): string => {
    if (isRTL) {
      return formatArabicTime(date);
    }
    // Dutch time format (24-hour)
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Format date and time together
   */
  const formatDateTime = (date: Date): string => {
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    return isRTL ? `${formattedTime} ${formattedDate}` : `${formattedDate} ${formattedTime}`;
  };

  /**
   * Format ordinal numbers (1st, 2nd, etc.)
   */
  const formatOrdinal = (num: number): string => {
    if (isRTL) {
      const arabicOrdinals: Record<number, string> = {
        1: 'الأول',
        2: 'الثاني', 
        3: 'الثالث',
        4: 'الرابع',
        5: 'الخامس',
        6: 'السادس',
        7: 'السابع',
        8: 'الثامن',
        9: 'التاسع',
        10: 'العاشر'
      };
      return arabicOrdinals[num] || toArabicNumerals(num.toString());
    }
    
    // Dutch ordinals
    const suffix = num === 1 ? 'ste' : num === 3 ? 'de' : 'de';
    return `${num}${suffix}`;
  };

  /**
   * Format file sizes
   */
  const formatFileSize = (bytes: number): string => {
    const units = isRTL 
      ? ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
      : ['B', 'KB', 'MB', 'GB'];
    
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    const formattedSize = formatNumber(size.toFixed(1));
    return `${formattedSize} ${units[unitIndex]}`;
  };

  /**
   * Format duration in minutes/hours
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      const formattedMinutes = formatNumber(minutes);
      return isRTL ? `${formattedMinutes} دقيقة` : `${formattedMinutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const formattedHours = formatNumber(hours);
    
    if (remainingMinutes === 0) {
      return isRTL ? `${formattedHours} ساعة` : `${formattedHours} uur`;
    }
    
    const formattedRemainingMinutes = formatNumber(remainingMinutes);
    return isRTL 
      ? `${formattedHours} ساعة و ${formattedRemainingMinutes} دقيقة`
      : `${formattedHours}u ${formattedRemainingMinutes}m`;
  };

  /**
   * Format count with proper pluralization
   */
  const formatCount = (count: number, singularNL: string, pluralNL: string, singularAR: string, pluralAR: string): string => {
    const formattedCount = formatNumber(count);
    
    if (isRTL) {
      return `${formattedCount} ${count === 1 ? singularAR : pluralAR}`;
    }
    
    return `${formattedCount} ${count === 1 ? singularNL : pluralNL}`;
  };

  return {
    formatNumber,
    formatPercentage,
    formatDate,
    formatTime,
    formatDateTime,
    formatOrdinal,
    formatFileSize,
    formatDuration,
    formatCount,
    isRTL
  };
};