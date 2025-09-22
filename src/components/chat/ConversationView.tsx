import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Users, User, Phone, VideoIcon, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useMessages, useChatRealtime, useMarkConversationAsRead } from '@/hooks/useChat';
import { EnhancedSkeleton, EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading-states';
import { NoChatMessagesEmptyState } from '@/components/ui/enhanced-empty-states';
import { cn } from '@/lib/utils';

interface ConversationViewProps {
  conversationId: string;
  onBack: () => void;
  className?: string;
}

export function ConversationView({ conversationId, onBack, className }: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messagesData, isLoading, error } = useMessages(conversationId);
  const { isConnected } = useChatRealtime(conversationId);
  const markAsRead = useMarkConversationAsRead();

  const messages = messagesData?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead.mutate(conversationId);
    }
  }, [conversationId, messages.length, markAsRead]);

  const getConversationTitle = () => {
    // TODO: Get actual conversation data and participant names
    return 'Gesprek';
  };

  const getConversationSubtitle = () => {
    if (isConnected) {
      return 'Online';
    }
    return 'Laatste activiteit: onbekend';
  };

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <EnhancedSkeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <EnhancedSkeleton className="h-4 w-32 mb-1" />
            <EnhancedSkeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "justify-start" : "justify-end")}>
              {i % 2 === 0 && <EnhancedSkeleton className="h-8 w-8 rounded-full" />}
              <EnhancedSkeleton className={cn("h-12 max-w-xs rounded-lg", i % 2 === 0 ? "w-48" : "w-32")} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">Fout</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <NoChatMessagesEmptyState
            onSendFirstMessage={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{getConversationTitle()}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {isConnected && (
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            )}
            {getConversationSubtitle()}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <VideoIcon className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Gesprek info</DropdownMenuItem>
              <DropdownMenuItem>Notificaties</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Gesprek verlaten
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <NoChatMessagesEmptyState />
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === 'current-user'} // TODO: Get actual current user ID
                showAvatar={
                  index === 0 || 
                  messages[index - 1]?.sender_id !== message.sender_id
                }
                showTimestamp={
                  index === messages.length - 1 ||
                  messages[index + 1]?.sender_id !== message.sender_id ||
                  new Date(messages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 5 * 60 * 1000 // 5 minutes
                }
              />
            ))
          )}
          
          <TypingIndicator isVisible={false} users={[]} />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-background">
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  );
}