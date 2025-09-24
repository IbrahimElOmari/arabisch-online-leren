import React from 'react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: LucideIcon;
  className?: string;
}

export const ResponsiveFormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  error,
  value,
  onChange,
  icon: Icon,
  className
}: FormFieldProps) => {
  const { isRTL, getTextAlign } = useRTLLayout();

  const fieldClasses = cn(
    'w-full transition-all duration-200',
    'focus:ring-2 focus:ring-primary/20',
    error && 'border-destructive focus:ring-destructive/20',
    isRTL && 'text-right arabic-text',
    className
  );

  const labelClasses = cn(
    'block text-sm font-medium mb-2',
    getTextAlign('left'),
    isRTL ? 'arabic-text' : '',
    required && "after:content-['*'] after:text-destructive after:ms-1"
  );

  const containerClasses = cn(
    'space-y-2',
    'w-full sm:max-w-md',
    '@container'
  );

  return (
    <div className={containerClasses}>
      <Label htmlFor={name} className={labelClasses}>
        {label}
      </Label>
      
      <div className="relative">
        {Icon && (
          <div className={cn(
            'absolute top-1/2 transform -translate-y-1/2 text-muted-foreground',
            isRTL ? 'right-3' : 'left-3'
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        
        {type === 'textarea' ? (
          <Textarea
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              fieldClasses,
              'min-h-[100px] resize-y'
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              fieldClasses,
              Icon && (isRTL ? 'pe-10' : 'ps-10')
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        )}
      </div>
      
      {error && (
        <p className={cn(
          'text-sm text-destructive',
          getTextAlign('left'),
          isRTL ? 'arabic-text' : ''
        )}>
          {error}
        </p>
      )}
    </div>
  );
};

interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  layout?: 'single' | 'double' | 'auto';
}

export const ResponsiveForm = ({ 
  children, 
  onSubmit, 
  className,
  layout = 'auto'
}: ResponsiveFormProps) => {
  const formClasses = cn(
    '@container w-full space-y-4',
    {
      'max-w-md mx-auto': layout === 'single',
      'max-w-2xl mx-auto': layout === 'double',
      'max-w-full': layout === 'auto',
    },
    '@md:space-y-6',
    className
  );

  const gridClasses = cn(
    {
      'grid grid-cols-1': layout === 'single',
      'grid grid-cols-1 @md:grid-cols-2 gap-4 @md:gap-6': layout === 'double',
      'grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 @md:gap-6': layout === 'auto',
    }
  );

  return (
    <form onSubmit={onSubmit} className={formClasses}>
      <div className={layout !== 'single' ? gridClasses : 'space-y-4'}>
        {children}
      </div>
    </form>
  );
};