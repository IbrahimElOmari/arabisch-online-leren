import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/contexts/TranslationContext';

export const useAccessibilityRTL = () => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  // ARIA attributes for RTL
  const getAriaFlowDirection = () => isRTL ? 'rtl' : 'ltr';
  
  const getAriaLabel = (key: string, fallback?: string) => {
    return isRTL ? t(`aria.${key}`) || fallback : fallback || t(`aria.${key}`);
  };

  // Screen reader announcements
  const getScreenReaderText = (text: string) => {
    return isRTL ? `${text} - ${t('aria.rtlMode')}` : text;
  };

  // Keyboard navigation
  const getKeyboardNavigation = () => ({
    'aria-keyshortcuts': isRTL ? t('aria.keyboardRTL') : t('aria.keyboardLTR'),
    'data-orientation': isRTL ? 'rtl' : 'ltr'
  });

  // Focus management
  const getFocusClasses = () => isRTL ? 'focus-rtl' : 'focus-ltr';

  // Skip links
  const getSkipLinkText = () => isRTL ? t('aria.skipToContent') : 'Skip to main content';

  // Navigation landmarks
  const getNavigationAttributes = () => ({
    role: 'navigation',
    'aria-label': getAriaLabel('navigation', 'Main navigation'),
    dir: isRTL ? 'rtl' : 'ltr'
  });

  // Form accessibility
  const getFormAttributes = (fieldName: string) => ({
    'aria-describedby': `${fieldName}-description`,
    'aria-required': 'true',
    dir: isRTL ? 'rtl' : 'ltr'
  });

  // Table accessibility
  const getTableAttributes = () => ({
    role: 'table',
    'aria-label': getAriaLabel('dataTable', 'Data table'),
    dir: isRTL ? 'rtl' : 'ltr'
  });

  // Live regions for dynamic content
  const getLiveRegionAttributes = () => ({
    'aria-live': 'polite',
    'aria-atomic': 'true',
    role: 'status',
    dir: isRTL ? 'rtl' : 'ltr'
  });

  // Dialog accessibility
  const getDialogAttributes = (title: string) => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': `dialog-title-${title}`,
    dir: isRTL ? 'rtl' : 'ltr'
  });

  // Button accessibility with RTL context
  const getButtonAttributes = (action: string) => ({
    'aria-label': getAriaLabel(`button.${action}`, action),
    type: 'button' as const,
    dir: isRTL ? 'rtl' : 'ltr'
  });

  return {
    isRTL,
    getAriaFlowDirection,
    getAriaLabel,
    getScreenReaderText,
    getKeyboardNavigation,
    getFocusClasses,
    getSkipLinkText,
    getNavigationAttributes,
    getFormAttributes,
    getTableAttributes,
    getLiveRegionAttributes,
    getDialogAttributes,
    getButtonAttributes,
  };
};