import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, User, Clock, Phone, Video } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  sender?: {
    id: string;
    full_name: string;
    role: string;
  };
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    full_name: string;
    role: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

export const DirectMessaging = () => {
  const { profile } = useAuth();
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{id: string; full_name: string; role: string}>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.id) {
      loadConversations();
      loadUsers();
      setupRealtimeSubscription();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('direct_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
        filter: `or(sender_id.eq.${profile?.id},receiver_id.eq.${profile?.id})`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;
          if (selectedConversation === getConversationId(newMessage.sender_id, newMessage.receiver_id)) {
            setMessages(prev => [...prev, newMessage]);
          }
          loadConversations(); // Refresh conversations list
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('id', profile?.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Mock conversation loading - would need proper implementation
      // This would require a more complex query joining messages and profiles
      const mockConversations: Conversation[] = users.map(user => ({
        id: getConversationId(profile!.id, user.id),
        participant: user,
        unreadCount: 0
      }));
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error(isRTL ? 'فشل تحميل المحادثات' : 'Fout bij laden gesprekken');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const [userId1, userId2] = conversationId.split('-');
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:sender_id(id, full_name, role)
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark messages as read
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error(isRTL ? 'فشل تحميل الرسائل' : 'Fout bij laden berichten');
    } finally {
      setLoading(false);
    }
  };

  const getConversationId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('-');
  };

  const markMessagesAsRead = async (conversationId: string) => {
    const [, receiverId] = conversationId.split('-');
    
    try {
      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('receiver_id', profile?.id)
        .eq('sender_id', receiverId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const [, receiverId] = selectedConversation.split('-');
    
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: profile?.id,
          receiver_id: receiverId,
          content: newMessage.trim(),
          read: false
        });

      if (error) throw error;
      
      setNewMessage('');
      toast.success(isRTL ? 'تم إرسال الرسالة' : 'Bericht verzonden');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isRTL ? 'فشل إرسال الرسالة' : 'Fout bij versturen bericht');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!profile) return null;

  return (
    <div className="flex h-[600px] border border-border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-border">
        <div className="p-4 border-b border-border">
          <h3 className={`font-semibold mb-3 ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'الرسائل المباشرة' : 'Directe Berichten'}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'البحث عن المستخدمين...' : 'Zoek gebruikers...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {filteredUsers.map((user) => {
              const conversationId = getConversationId(profile.id, user.id);
              const conversation = conversations.find(c => c.id === conversationId);
              
              return (
                <div
                  key={user.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedConversation === conversationId 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'hover:bg-muted'
                    }
                  `}
                  onClick={() => setSelectedConversation(conversationId)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                      <h4 className={`font-medium truncate ${isRTL ? 'arabic-text' : ''}`}>
                        {user.full_name}
                      </h4>
                      {conversation?.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role === 'leerkracht' 
                        ? (isRTL ? 'معلم' : 'Leraar')
                        : user.role === 'leerling'
                          ? (isRTL ? 'طالب' : 'Student')
                          : user.role
                      }
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                <div className={`flex items-center gap-3 ${getFlexDirection()}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {users.find(u => selectedConversation.includes(u.id))?.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className={`font-medium ${isRTL ? 'arabic-text' : ''}`}>
                      {users.find(u => selectedConversation.includes(u.id))?.full_name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'متصل' : 'Online'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === profile.id 
                      ? (isRTL ? 'justify-start' : 'justify-end')
                      : (isRTL ? 'justify-end' : 'justify-start')
                    }`}
                  >
                    <div
                      className={`
                        max-w-[70%] p-3 rounded-lg
                        ${message.sender_id === profile.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                        }
                      `}
                    >
                      <p className={`text-sm ${isRTL ? 'arabic-text text-right' : 'text-left'}`}>
                        {message.content}
                      </p>
                      <div className={`flex items-center gap-1 mt-1 text-xs opacity-70 ${getFlexDirection()}`}>
                        <Clock className="h-3 w-3" />
                        <span>{formatMessageTime(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <Input
                  placeholder={isRTL ? 'اكتب رسالة...' : 'Typ een bericht...'}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'اختر محادثة للبدء' : 'Selecteer een gesprek om te beginnen'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};