/**
 * Utility functions for Arabic text processing and RTL support
 */

// Convert Western Arabic numerals to Eastern Arabic numerals
export const toArabicNumerals = (text: string): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (match) => arabicNumerals[parseInt(match)]);
};

// Convert Eastern Arabic numerals to Western Arabic numerals
export const toWesternNumerals = (text: string): string => {
  const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', 'ن', '٧', '٨', '٩'];
  
  return text.replace(/[٠-٩]/g, (match) => {
    const index = arabicNumerals.indexOf(match);
    return index !== -1 ? westernNumerals[index] : match;
  });
};

// Format dates in Arabic
export const formatArabicDate = (date: Date): string => {
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  const day = toArabicNumerals(date.getDate().toString());
  const month = arabicMonths[date.getMonth()];
  const year = toArabicNumerals(date.getFullYear().toString());
  
  return `${day} ${month} ${year}`;
};

// Format time in Arabic
export const formatArabicTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  const hour12 = hours % 12 || 12;
  
  const hourStr = toArabicNumerals(hour12.toString().padStart(2, '0'));
  const minuteStr = toArabicNumerals(minutes.toString().padStart(2, '0'));
  
  return `${hourStr}:${minuteStr} ${period}`;
};

// Check if text is Arabic
export const isArabicText = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};

// Get text direction based on content
export const getTextDirection = (text: string): 'ltr' | 'rtl' => {
  return isArabicText(text) ? 'rtl' : 'ltr';
};

// Truncate Arabic text properly
export const truncateArabicText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  
  // Find the last space before the limit
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

// Format Arabic names properly
export const formatArabicName = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

// Convert percentage to Arabic format
export const formatArabicPercentage = (value: number): string => {
  const percentage = Math.round(value);
  return `%${toArabicNumerals(percentage.toString())}`;
};

// Format Arabic currency (assuming Saudi Riyal as example)
export const formatArabicCurrency = (amount: number): string => {
  const formattedAmount = toArabicNumerals(amount.toFixed(2));
  return `${formattedAmount} ريال`;
};

// Get Arabic ordinal numbers (1st, 2nd, etc.)
export const getArabicOrdinal = (num: number): string => {
  const arabicOrdinals = {
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
  
  return arabicOrdinals[num as keyof typeof arabicOrdinals] || `${toArabicNumerals(num.toString())}`;
};

export default {
  toArabicNumerals,
  toWesternNumerals,
  formatArabicDate,
  formatArabicTime,
  isArabicText,
  getTextDirection,
  truncateArabicText,
  formatArabicName,
  formatArabicPercentage,
  formatArabicCurrency,
  getArabicOrdinal,
};