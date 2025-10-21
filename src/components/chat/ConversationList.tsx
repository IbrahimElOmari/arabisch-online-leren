import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { User, Users, Circle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/services/chatService';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/enhanced-empty-states';

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (conversationId: string) => void;
  selectedId?: string;
  className?: string;
}

export function ConversationList({ 
  conversations, 
  onSelect, 
  selectedId,
  className 
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className={cn("flex-1 p-6", className)}>
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Geen gesprekken"
          description="Je hebt nog geen gesprekken. Start een nieuw gesprek met je klasgenoten of docenten."
          action={{
            label: "Nieuw gesprek",
            onClick: () => {},
            variant: "outline" as const
          }}
        />
      </div>
    );
  }

  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div className="space-y-2 p-4">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedId === conversation.id}
            onSelect={() => onSelect(conversation.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

function ConversationItem({ conversation, isSelected, onSelect }: ConversationItemProps) {
  const getConversationTitle = () => {
    if (conversation.type === 'class') {
      // Get class name from participants or use generic name
      return `Klas gesprek`;
    }
    
    // For DM, show other participant's name
    const otherParticipant = conversation.participants?.find(p => p.user_id !== conversation.created_by);
    return otherParticipant?.user?.full_name || 'Direct bericht';
  };

  const getConversationIcon = () => {
    return conversation.type === 'class' ? (
      <Users className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  const getLastMessagePreview = () => {
    if (!conversation.last_message) return 'Geen berichten';
    
    const content = conversation.last_message.content;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const getTimeAgo = () => {
    if (!conversation.last_message) return '';
    
    return formatDistanceToNow(new Date(conversation.last_message.created_at), {
      addSuffix: true,
      locale: nl,
    });
  };

  return (
    <Button
      variant={isSelected ? "secondary" : "ghost"}
      className={cn(
        "w-full h-auto p-3 justify-start text-left",
        isSelected && "bg-accent",
        conversation.unread_count && conversation.unread_count > 0 && "font-medium"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 w-full">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback>
            {getConversationIcon()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium truncate">
              {getConversationTitle()}
            </h4>
            {conversation.unread_count && conversation.unread_count > 0 && (
              <Badge 
                variant="destructive" 
                className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ms-2"
              >
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate">
              {getLastMessagePreview()}
            </p>
            <span className="text-xs text-muted-foreground ms-2 flex-shrink-0">
              {getTimeAgo()}
            </span>
          </div>
        </div>
        
        {conversation.unread_count && conversation.unread_count > 0 && (
          <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
        )}
      </div>
    </Button>
  );
}