import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useTranslation } from '@/contexts/TranslationContext';
import { 
  Users, 
  MessageSquare, 
  Pencil, 
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StudyRoomProps {
  roomId: string;
  roomName: string;
  moduleId?: string;
  niveauId?: string;
}

interface Participant {
  id: string;
  user_id: string;
  username: string;
  joined_at: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
}

export const StudyRoom: React.FC<StudyRoomProps> = ({
  roomId,
  roomName,
}) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard' | 'participants'>('chat');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      joinRoom();
      loadParticipants();
      loadMessages();
      subscribeToUpdates();
    }

    return () => {
      leaveRoom();
    };
  }, [roomId, profile?.id]);

  const joinRoom = async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('study_room_participants')
        .insert([
          {
            room_id: roomId,
            participant_id: profile.id,
            joined_at: new Date().toISOString(),
          },
        ]);

      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }

      setIsJoined(true);
      toast({
        title: t('study.joined_room', 'Joined Study Room'),
        description: roomName,
      });
    } catch (error: any) {
      console.error('Failed to join room:', error);
    }
  };

  const leaveRoom = async () => {
    if (!profile?.id || !isJoined) return;

    try {
      await supabase
        .from('study_room_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('participant_id', profile.id)
        .is('left_at', null);

      setIsJoined(false);
    } catch (error: any) {
      console.error('Failed to leave room:', error);
    }
  };

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('study_room_participants')
        .select(`
          *,
          profile:profiles!study_room_participants_participant_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('room_id', roomId)
        .is('left_at', null);

      if (error) throw error;

      const participantsList = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.participant_id,
        username: p.profile?.email?.split('@')[0] || 'Anonymous',
        joined_at: p.joined_at,
      }));

      setParticipants(participantsList);
    } catch (error: any) {
      console.error('Failed to load participants:', error);
    }
  };

  const loadMessages = async () => {
    // In a real implementation, you'd have a messages table
    // For now, we'll use mock messages
    setMessages([
      {
        id: '1',
        user_id: 'user1',
        username: 'Student 1',
        message: 'Hello! Anyone want to practice together?',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: '2',
        user_id: 'user2',
        username: 'Student 2',
        message: 'Yes! I need help with grammar.',
        timestamp: new Date(Date.now() - 240000).toISOString(),
      },
    ]);
  };

  const subscribeToUpdates = () => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`study_room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile?.id) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user_id: profile.id,
      username: profile.email?.split('@')[0] || 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // In a real implementation, save to database
    toast({
      title: t('common.sent', 'Message sent'),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {roomName}
          </CardTitle>
          <Badge variant="secondary">
            {participants.length} {t('study.participants', 'participants')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="mx-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('study.chat', 'Chat')}
            </TabsTrigger>
            <TabsTrigger value="whiteboard" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              {t('study.whiteboard', 'Whiteboard')}
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('study.participants', 'Participants')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0 px-4">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${
                      msg.user_id === profile?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {msg.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        msg.user_id === profile?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 py-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('study.type_message', 'Type a message...')}
                className="flex-1"
              />
              <Button onClick={sendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="whiteboard" className="flex-1 m-0 px-4">
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
              <div className="text-center space-y-4">
                <Pencil className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {t('study.whiteboard_coming_soon', 'Collaborative whiteboard coming soon')}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="flex-1 m-0 px-4">
            <ScrollArea className="h-full">
              <div className="space-y-2 py-4">
                {participants.map((participant) => (
                  <Card key={participant.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{participant.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('study.joined', 'Joined')} {new Date(participant.joined_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {participant.user_id === profile?.id && (
                        <Badge variant="secondary">{t('common.you', 'You')}</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {participants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('study.no_participants', 'No participants yet')}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
