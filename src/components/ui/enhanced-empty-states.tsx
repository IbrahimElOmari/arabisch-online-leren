import React from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Search,
  AlertTriangle,
  WifiOff,
  Bell,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

interface BaseEmptyStateProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface EmptyStateWithActionProps extends BaseEmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

// Base Empty State Component
export const EmptyState = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  size = 'md'
}: EmptyStateWithActionProps) => {
  const { isRTL, getTextAlign } = useRTLLayout();

  const sizeStyles = {
    sm: {
      container: 'py-8',
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-2'
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6'
    }
  };

  const styles = sizeStyles[size];

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        styles.spacing,
        getTextAlign('center')
      )}>
        <div className={cn(
          'rounded-full bg-muted/50 p-4 mb-2',
          'text-muted-foreground'
        )}>
          <div className={styles.icon}>
            {icon}
          </div>
        </div>

        <h3 className={cn(
          'font-semibold tracking-tight',
          styles.title,
          isRTL && 'arabic-text'
        )}>
          {title}
        </h3>

        <p className={cn(
          'text-muted-foreground max-w-sm',
          styles.description,
          isRTL && 'arabic-text'
        )}>
          {description}
        </p>

        {(action || secondaryAction) && (
          <div className={cn(
            'flex flex-col sm:flex-row gap-2 mt-4',
            isRTL && 'sm:flex-row-reverse'
          )}>
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
                className="animate-fade-in"
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                className="animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Specific Empty State Components for different scenarios

// No Classes/Lessons Available
export const NoClassesEmptyState = ({ 
  onCreateClass, 
  onBrowseClasses,
  className 
}: {
  onCreateClass?: () => void;
  onBrowseClasses?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.no_classes.title', 'Geen klassen beschikbaar')}
      description={t('empty.no_classes.description', 'Je bent nog niet ingeschreven voor een klas. Neem contact op met je leerkracht of beheerder.')}
      icon={<BookOpen className="h-full w-full" />}
      action={onBrowseClasses ? {
        label: t('empty.no_classes.browse', 'Bekijk beschikbare klassen'),
        onClick: onBrowseClasses
      } : undefined}
      secondaryAction={onCreateClass ? {
        label: t('empty.no_classes.create', 'Nieuwe klas aanvragen'),
        onClick: onCreateClass
      } : undefined}
      className={className}
    />
  );
};

// No Forum Threads
export const NoForumThreadsEmptyState = ({ 
  onCreateThread,
  className 
}: {
  onCreateThread?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.no_threads.title', 'Geen discussies gevonden')}
      description={t('empty.no_threads.description', 'Er zijn nog geen forumthreads. Start een nieuwe discussie of stel een vraag!')}
      icon={<MessageSquare className="h-full w-full" />}
      action={onCreateThread ? {
        label: t('empty.no_threads.create', 'Nieuwe discussie starten'),
        onClick: onCreateThread,
        variant: 'default'
      } : undefined}
      className={className}
    />
  );
};

// No Analytics Data
export const NoAnalyticsEmptyState = ({ 
  onRefresh,
  className 
}: {
  onRefresh?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.no_analytics.title', 'Geen analytics data')}
      description={t('empty.no_analytics.description', 'Er is nog geen data beschikbaar voor analyse. Begin met lessen volgen om je voortgang te bekijken.')}
      icon={<BarChart3 className="h-full w-full" />}
      action={onRefresh ? {
        label: t('empty.no_analytics.refresh', 'Vernieuwen'),
        onClick: onRefresh,
        variant: 'outline'
      } : undefined}
      className={className}
    />
  );
};

// No Messages/Chat
export const NoChatMessagesEmptyState = ({ 
  onSendFirstMessage,
  className 
}: {
  onSendFirstMessage?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.no_messages.title', 'Nog geen berichten')}
      description={t('empty.no_messages.description', 'Start een gesprek door je eerste bericht te sturen!')}
      icon={<MessageSquare className="h-full w-full" />}
      action={onSendFirstMessage ? {
        label: t('empty.no_messages.send', 'Eerste bericht sturen'),
        onClick: onSendFirstMessage
      } : undefined}
      size="sm"
      className={className}
    />
  );
};

// No Search Results
export const NoSearchResultsEmptyState = ({ 
  searchQuery,
  onClearSearch,
  className 
}: {
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.no_results.title', 'Geen resultaten gevonden')}
      description={searchQuery 
        ? t('empty.no_results.description_with_query', `Geen resultaten voor "${searchQuery}". Probeer andere zoektermen.`)
        : t('empty.no_results.description', 'Probeer andere zoektermen of filters.')
      }
      icon={<Search className="h-full w-full" />}
      action={onClearSearch ? {
        label: t('empty.no_results.clear', 'Zoekterm wissen'),
        onClick: onClearSearch,
        variant: 'outline'
      } : undefined}
      size="sm"
      className={className}
    />
  );
};

// No Students/Users
export const NoUsersEmptyState = ({ 
  onInviteUsers,
  userType = 'gebruikers',
  className 
}: {
  onInviteUsers?: () => void;
  userType?: string;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.no_users.title', `Geen ${userType} gevonden`)}
      description={t('empty.no_users.description', `Er zijn nog geen ${userType} in deze klas. Nodig mensen uit om deel te nemen.`)}
      icon={<Users className="h-full w-full" />}
      action={onInviteUsers ? {
        label: t('empty.no_users.invite', `${userType.charAt(0).toUpperCase() + userType.slice(1)} uitnodigen`),
        onClick: onInviteUsers
      } : undefined}
      className={className}
    />
  );
};

// Connection Error
export const ConnectionErrorEmptyState = ({ 
  onRetry,
  className 
}: {
  onRetry?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.connection_error.title', 'Verbindingsprobleem')}
      description={t('empty.connection_error.description', 'Kan geen verbinding maken met de server. Controleer je internetverbinding.')}
      icon={<WifiOff className="h-full w-full text-destructive" />}
      action={onRetry ? {
        label: t('empty.connection_error.retry', 'Opnieuw proberen'),
        onClick: onRetry
      } : undefined}
      className={className}
    />
  );
};

// Offline State
export const OfflineEmptyState = ({ 
  onGoOnline,
  className 
}: {
  onGoOnline?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.offline.title', 'Offline modus')}
      description={t('empty.offline.description', 'Je bent offline. Sommige functies zijn mogelijk beperkt beschikbaar.')}
      icon={<WifiOff className="h-full w-full text-warning" />}
      action={onGoOnline ? {
        label: t('empty.offline.reconnect', 'Verbinding herstellen'),
        onClick: onGoOnline,
        variant: 'outline'
      } : undefined}
      className={className}
    />
  );
};

// No Notifications
export const NoNotificationsEmptyState = ({ 
  className 
}: {
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.no_notifications.title', 'Geen meldingen')}
      description={t('empty.no_notifications.description', 'Je hebt geen nieuwe meldingen. We houden je op de hoogte van belangrijke updates!')}
      icon={<Bell className="h-full w-full" />}
      size="sm"
      className={className}
    />
  );
};

// Maintenance Mode
export const MaintenanceEmptyState = ({ 
  className 
}: {
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.maintenance.title', 'Onderhoud')}
      description={t('empty.maintenance.description', 'We werken momenteel aan verbeteringen. Probeer het over een paar minuten opnieuw.')}
      icon={<Settings className="h-full w-full animate-spin text-primary" />}
      className={className}
    />
  );
};

// Access Denied
export const AccessDeniedEmptyState = ({ 
  onGoBack,
  className 
}: {
  onGoBack?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyState
      title={t('empty.access_denied.title', 'Geen toegang')}
      description={t('empty.access_denied.description', 'Je hebt geen toestemming om deze pagina te bekijken. Neem contact op met een beheerder.')}
      icon={<AlertTriangle className="h-full w-full text-destructive" />}
      action={onGoBack ? {
        label: t('empty.access_denied.go_back', 'Terug gaan'),
        onClick: onGoBack,
        variant: 'outline'
      } : undefined}
      className={className}
    />
  );
};

export default {
  EmptyState,
  NoClassesEmptyState,
  NoForumThreadsEmptyState,
  NoAnalyticsEmptyState,
  NoChatMessagesEmptyState,
  NoSearchResultsEmptyState,
  NoUsersEmptyState,
  ConnectionErrorEmptyState,
  OfflineEmptyState,
  NoNotificationsEmptyState,
  MaintenanceEmptyState,
  AccessDeniedEmptyState,
};