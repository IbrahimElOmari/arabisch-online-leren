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
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  unreadCount: number;
}

export const DirectMessaging = () => {
  const { profile } = useAuth();
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{id: string; full_name: string; role: string}>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.id) {
      loadConversations();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // Get all users first
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('id', profile.id);
      
      if (usersError) throw usersError;
      
      // Use RPC to get messages for this user
      const { data: messages, error: messagesError } = await supabase
        .rpc('get_direct_messages', { user_id: profile.id });
      
      if (messagesError) {
        if (import.meta.env.DEV) console.log('RPC failed, using fallback approach:', messagesError);
        // Fallback to creating conversations from user list
        const convMap = new Map<string, Conversation>();
        
        allUsers?.forEach(otherUser => {
          convMap.set(otherUser.id, {
            id: getConversationId(profile.id, otherUser.id),
            participantId: otherUser.id,
            participantName: otherUser.full_name || 'Unknown',
            participantRole: otherUser.role || 'leerling',
            unreadCount: 0
          });
        });
        
        setConversations(Array.from(convMap.values()));
        setUsers(allUsers || []);
        setLoading(false);
        return;
      }
      
      // Process conversations
      const convMap = new Map<string, Conversation>();
      
      allUsers?.forEach(otherUser => {
        const userMessages = messages?.filter((msg: any) => 
          msg.sender_id === otherUser.id || msg.receiver_id === otherUser.id
        ) || [];
        
        const unreadCount = userMessages.filter((msg: any) => 
          msg.receiver_id === profile.id && !msg.read
        ).length;
        
        convMap.set(otherUser.id, {
          id: getConversationId(profile.id, otherUser.id),
          participantId: otherUser.id,
          participantName: otherUser.full_name || 'Unknown',
          participantRole: otherUser.role || 'leerling',
          unreadCount
        });
      });
      
      setConversations(Array.from(convMap.values()));
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error(isRTL ? 'فشل تحميل المحادثات' : 'Fout bij laden gesprekken');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!profile?.id) return;
    
    const otherUserId = conversationId.split('_').find(id => id !== profile.id);
    if (!otherUserId) return;
    
    try {
      // Use RPC call for now since types might not be updated
      const { data, error } = await supabase
        .rpc('get_conversation_messages', { 
          user1_id: profile.id, 
          user2_id: otherUserId 
        });
      
      if (error) {
        if (import.meta.env.DEV) console.log('Messages RPC failed:', error);
        setMessages([]);
        return;
      }
      
      setMessages(data || []);
      
      // Mark messages as read
      await markMessagesAsRead(otherUserId);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !profile?.id) return;
    
    const receiverId = selectedConversation.participantId;
    
    try {
      // Use RPC to insert message
      const { error } = await supabase
        .rpc('send_direct_message', {
          sender_id: profile.id,
          receiver_id: receiverId,
          message_content: newMessage.trim()
        });
      
      if (error) {
        if (import.meta.env.DEV) console.log('Send message RPC failed:', error);
        toast.error(isRTL ? 'فشل إرسال الرسالة' : 'Fout bij versturen bericht');
        return;
      }
      
      setNewMessage('');
      toast.success(isRTL ? 'تم إرسال الرسالة' : 'Bericht verzonden');
      
      // Reload messages to show the new one
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isRTL ? 'فشل إرسال الرسالة' : 'Fout bij versturen bericht');
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!profile?.id) return;
    
    try {
      const { error } = await supabase
        .rpc('mark_messages_read', {
          sender_id: senderId,
          receiver_id: profile.id
        });
      
      if (error) {
        if (import.meta.env.DEV) console.log('Mark read RPC failed:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getConversationId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
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

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
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
              className="ps-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                  ${selectedConversation?.id === conversation.id 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'hover:bg-muted'
                  }
                `}
                onClick={() => setSelectedConversation(conversation)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{conversation.participantName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                    <h4 className={`font-medium truncate ${isRTL ? 'arabic-text' : ''}`}>
                      {conversation.participantName}
                    </h4>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {conversation.participantRole === 'leerkracht' 
                      ? (isRTL ? 'معلم' : 'Leraar')
                      : conversation.participantRole === 'leerling'
                        ? (isRTL ? 'طالب' : 'Student')
                        : conversation.participantRole
                    }
                  </p>
                </div>
              </div>
            ))}
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
                      {selectedConversation.participantName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className={`font-medium ${isRTL ? 'arabic-text' : ''}`}>
                      {selectedConversation.participantName}
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