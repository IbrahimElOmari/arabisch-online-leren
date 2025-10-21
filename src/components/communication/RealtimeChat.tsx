import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Users, 
  Circle,
  Mic,
  MicOff
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/app';
import { ROLE_LABELS } from '@/types/roles';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio';
  reply_to?: string;
}

interface ChatUser {
  id: string;
  name: string;
  role: UserRole;
  online: boolean;
  avatar?: string;
}

interface RealtimeChatProps {
  roomId: string;
  roomType: 'class' | 'level' | 'direct';
  className?: string;
}

export const RealtimeChat: React.FC<RealtimeChatProps> = ({ 
  className 
}) => {
  const { user, profile } = useAuth();
  const { themeAge } = useAgeTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with real Supabase realtime
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        sender_id: 'teacher1',
        sender_name: 'Mevrouw Sarah',
        content: 'Goedemorgen allemaal! Vandaag gaan we werken aan les 3.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text'
      },
      {
        id: '2',
        sender_id: 'student1',
        sender_name: 'Ahmed',
        content: 'Goedemorgen mevrouw! Ik heb de voorbereiding gedaan.',
        timestamp: new Date(Date.now() - 3300000).toISOString(),
        type: 'text'
      },
      {
        id: '3',
        sender_id: user?.id || 'current',
        sender_name: profile?.full_name || 'Jij',
        content: 'Ik heb een vraag over de grammatica van gisteren.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text'
      }
    ];

    const mockUsers: ChatUser[] = [
      {
        id: 'teacher1',
        name: 'Mevrouw Sarah',
        role: 'leerkracht',
        online: true
      },
      {
        id: 'student1',
        name: 'Ahmed',
        role: 'leerling',
        online: true
      },
      {
        id: 'student2',
        name: 'Fatima',
        role: 'leerling',
        online: false
      },
      {
        id: user?.id || 'current',
        name: profile?.full_name || 'Jij',
        role: 'leerling',
        online: true
      }
    ];

    setMessages(mockMessages);
    setOnlineUsers(mockUsers);
  }, [user?.id, profile?.full_name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || 'current',
      sender_name: profile?.full_name || 'Jij',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Here you would send to Supabase realtime
    // supabase.channel('chat:' + roomId).send({
    //   type: 'broadcast',
    //   event: 'message',
    //   payload: message
    // });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === user?.id || senderId === 'current';
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'leerkracht': return 'text-primary';
      case 'admin': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'border-2 hover:shadow-lg transition-all duration-300';
      case 'professional':
        return 'border subtle-hover';
      default:
        return 'hover:shadow-md transition-shadow';
    }
  };

  return (
    <Card className={cn(getThemeClasses(), className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Klas Chat</CardTitle>
          <div className="flex items-center gap-2">
            <Circle className="h-2 w-2 text-success fill-current" />
            <span className="text-sm text-muted-foreground">
              {onlineUsers.filter(u => u.online).length} online
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Online Users */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Online nu</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {onlineUsers.filter(u => u.online).map((user) => (
              <div key={user.id} className="flex flex-col items-center min-w-0">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Circle className="absolute -bottom-1 -right-1 h-3 w-3 text-success fill-current bg-background rounded-full" />
                </div>
                <span className="text-xs text-center mt-1 max-w-12 truncate">
                  {user.name.split(' ')[0]}
                </span>
                <Badge variant="outline" className={cn("text-xs mt-1", getRoleColor(user.role))}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-96 px-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isCurrentUser(message.sender_id) && "flex-row-reverse"
                )}
              >
                {!isCurrentUser(message.sender_id) && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {message.sender_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "flex-1 max-w-[70%]",
                    isCurrentUser(message.sender_id) && "text-right"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!isCurrentUser(message.sender_id) && (
                      <span className="text-sm font-medium">{message.sender_name}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  <div
                    className={cn(
                      "inline-block p-3 rounded-lg text-sm",
                      isCurrentUser(message.sender_id)
                        ? "bg-primary text-primary-foreground ms-auto"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Typ je bericht..."
                className="pe-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4 text-destructive" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              size="sm"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};