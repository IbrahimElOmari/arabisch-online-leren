import React from 'react';
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

export interface ToastOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// Enhanced toast variants with better UX
const enhancedToast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      className: 'border-l-4 border-l-success bg-success/5',
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      position: options?.position || 'top-right',
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      className: 'border-l-4 border-l-destructive bg-destructive/5',
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      icon: <AlertTriangle className="h-4 w-4 text-warning" />,
      className: 'border-l-4 border-l-warning bg-warning/5',
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: <Info className="h-4 w-4 text-info" />,
      className: 'border-l-4 border-l-info bg-info/5',
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },
  
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: Infinity, // Keep loading until dismissed
      position: options?.position || 'top-right',
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      className: 'border-l-4 border-l-primary bg-primary/5',
    });
  },
  
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      position: options?.position || 'top-right',
      duration: options?.duration || 4000,
    });
  },
  
  // Custom toast with full control
  custom: (content: (id: string | number) => React.ReactElement, options?: ToastOptions) => {
    sonnerToast.custom(content, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
    });
  },
  
  // Dismiss specific toast or all toasts
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
  
  // Action toast with enhanced styling
  action: (
    message: string, 
    actionLabel: string, 
    actionCallback: () => void,
    options?: ToastOptions
  ) => {
    sonnerToast(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      position: options?.position || 'top-right',
      action: {
        label: actionLabel,
        onClick: actionCallback,
      },
      className: 'border-l-4 border-l-primary bg-primary/5',
    });
  }
};

// Enhanced Toaster component with better positioning and styling
export const EnhancedToaster = () => {
  const { isRTL } = useRTLLayout();
  const { t } = useTranslation();
  
  return (
    <SonnerToaster
      position={isRTL ? 'top-left' : 'top-right'}
      dir={isRTL ? 'rtl' : 'ltr'}
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--card-foreground))',
        },
        className: cn(
          'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground',
          'group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          'group-[.toaster]:rounded-md group-[.toaster]:p-4',
          'animate-slide-in-right',
          isRTL && 'arabic-text'
        ),
        descriptionClassName: cn(
          'group-[.toast]:text-muted-foreground',
          isRTL && 'arabic-text'
        ),
      }}
      closeButton
      richColors
      expand
      visibleToasts={5}
    />
  );
};

export { enhancedToast as toast };
export default enhancedToast;