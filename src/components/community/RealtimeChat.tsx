
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Hash, Users, Settings, Smile, Paperclip } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system';
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isActive?: boolean;
}

interface RealtimeChatProps {
  channels: ChatChannel[];
  currentChannel: string;
  messages: ChatMessage[];
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onSendMessage: (content: string, channelId: string) => void;
  onJoinChannel: (channelId: string) => void;
}

export const RealtimeChat = ({ 
  channels, 
  currentChannel, 
  messages, 
  currentUser, 
  onSendMessage, 
  onJoinChannel 
}: RealtimeChatProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChannelData = channels.find(c => c.id === currentChannel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim(), currentChannel);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-64 bg-muted/30 border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Kanalen
          </h3>
        </div>
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={currentChannel === channel.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto p-3"
                onClick={() => onJoinChannel(channel.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Hash className="h-4 w-4 shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{channel.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {channel.memberCount} leden
                    </div>
                  </div>
                  {channel.isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4" />
                {currentChannelData?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentChannelData?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {currentChannelData?.memberCount}
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                {message.type === 'message' ? (
                  <>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.userAvatar} />
                      <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <Separator className="flex-1" />
                      <Badge variant="outline" className="text-xs">
                        {message.content}
                      </Badge>
                      <Separator className="flex-1" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-center gap-2">
            <Input
              placeholder={`Bericht naar #${currentChannelData?.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button variant="ghost" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
