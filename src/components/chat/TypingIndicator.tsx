
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface TypingUser {
  id: string;
  full_name: string;
  role?: string;
}

interface TypingIndicatorProps {
  isVisible: boolean;
  users: TypingUser[];
  className?: string;
}

export function TypingIndicator({ isVisible, users, className }: TypingIndicatorProps) {
  const { isRTL } = useRTLLayout();

  if (!isVisible || users.length === 0) {
    return null;
  }

  const renderTypingText = () => {
    if (users.length === 1) {
      return `${users[0].full_name} is aan het typen`;
    } else if (users.length === 2) {
      return `${users[0].full_name} en ${users[1].full_name} zijn aan het typen`;
    } else {
      return `${users[0].full_name} en ${users.length - 1} anderen zijn aan het typen`;
    }
  };

  const renderTypingDots = () => (
    <div className="flex space-x-1">
      <div 
        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );

  return (
    <div 
      className={cn(
        "flex gap-3 animate-fade-in opacity-70",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Avatar for first user */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {users[0]?.full_name ? (
              users[0].full_name.charAt(0).toUpperCase()
            ) : (
              <User className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Typing bubble */}
      <div className="flex-1 max-w-xs">
        <div className={cn(
          "relative px-4 py-2 rounded-2xl bg-muted rounded-bl-md",
          isRTL && "rounded-bl-2xl rounded-br-md"
        )}>
          {/* Typing dots animation */}
          <div className="flex items-center gap-2 text-muted-foreground">
            {renderTypingDots()}
            <span className={cn(
              "text-xs",
              isRTL && "arabic-text"
            )}>
              {renderTypingText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}