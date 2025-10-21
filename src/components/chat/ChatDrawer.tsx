import { useState } from 'react';
import { MessageCircle, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { useConversations } from '@/hooks/useChat';
import { isFeatureEnabled } from '@/config/featureFlags';
import { cn } from '@/lib/utils';

interface ChatDrawerProps {
  className?: string;
}

export function ChatDrawer({ className }: ChatDrawerProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: conversations = [] } = useConversations();

  if (!isFeatureEnabled('chat')) {
    return null;
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  const dmConversations = conversations.filter(c => c.type === 'dm');
  const classConversations = conversations.filter(c => c.type === 'class');

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative", className)}
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-[480px] p-0">
        <div className="flex flex-col h-full">
          {selectedConversationId ? (
            <ConversationView 
              conversationId={selectedConversationId}
              onBack={handleBackToList}
            />
          ) : (
            <>
              <SheetHeader className="p-6 pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Berichten
                  {totalUnread > 0 && (
                    <Badge variant="secondary">
                      {totalUnread} ongelezen
                    </Badge>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="all" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 mx-6 mb-4">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Alle
                    </TabsTrigger>
                    <TabsTrigger value="dm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Direct
                      {dmConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) > 0 && (
                        <Badge variant="destructive" className="ms-1 h-4 w-4 p-0 text-xs">
                          {dmConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="class" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Klas
                      {classConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) > 0 && (
                        <Badge variant="destructive" className="ms-1 h-4 w-4 p-0 text-xs">
                          {classConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="all" className="h-full m-0">
                      <ConversationList 
                        conversations={conversations}
                        onSelect={handleConversationSelect}
                      />
                    </TabsContent>
                    
                    <TabsContent value="dm" className="h-full m-0">
                      <ConversationList 
                        conversations={dmConversations}
                        onSelect={handleConversationSelect}
                      />
                    </TabsContent>
                    
                    <TabsContent value="class" className="h-full m-0">
                      <ConversationList 
                        conversations={classConversations}
                        onSelect={handleConversationSelect}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}