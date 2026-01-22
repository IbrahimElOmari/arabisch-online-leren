import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface ContextualTooltipProps {
  helpKey: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

/**
 * ContextualTooltip - Displays help information on hover
 * 
 * Usage:
 * <ContextualTooltip helpKey="dashboard_classes" />
 * 
 * Requires translation keys in format: help.tooltips.{helpKey}
 */
export function ContextualTooltip({
  helpKey,
  side = 'top',
  className,
  iconClassName,
}: ContextualTooltipProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTLLayout();

  // Get the tooltip text from translations
  const tooltipText = t(`help.tooltips.${helpKey}`);

  // Don't render if no translation exists
  if (!tooltipText || tooltipText === `help.tooltips.${helpKey}`) {
    return null;
  }

  // Adjust side for RTL
  const adjustedSide = isRTL
    ? side === 'left'
      ? 'right'
      : side === 'right'
      ? 'left'
      : side
    : side;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full p-1',
              'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'transition-colors',
              className
            )}
            aria-label={t('help.openTooltip')}
          >
            <HelpCircle
              className={cn(
                'h-4 w-4 text-muted-foreground hover:text-primary transition-colors',
                iconClassName
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={adjustedSide}
          className={cn(
            'max-w-[300px] text-sm',
            isRTL && 'text-right arabic-text'
          )}
        >
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ContextualTooltip;
