
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import ForumPostsList from './ForumPostsList';
import { 
  MessageCircle, 
  Plus,
  Send,
  ArrowLeft,
  Users,
  Hash
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ForumRoom {
  id: string;
  name: string;
  class_name: string;
  level_name: string;
  post_count?: number;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  class_id: string;
  created_at: string;
  is_pinned: boolean;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface ForumMainProps {
  classId: string;
}

const ForumMain = ({ classId }: ForumMainProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<'rooms' | 'threads' | 'posts'>('rooms');
  const [rooms, setRooms] = useState<ForumRoom[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');

  useEffect(() => {
    if (classId) {
      fetchRooms();
    }
  }, [classId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('niveaus')
        .select(`
          id,
          naam,
          niveau_nummer,
          class_id,
          klassen:class_id (
            id,
            name
          )
        `)
        .eq('class_id', classId)
        .eq('is_actief', true)
        .order('niveau_nummer');

      if (error) throw error;
      
      const formattedRooms = data?.map(niveau => ({
        id: niveau.id,
        name: niveau.naam,
        class_name: niveau.klassen?.name || 'Onbekende Klas',
        level_name: `Niveau ${niveau.niveau_nummer}`,
        post_count: 0
      })) || [];

      setRooms(formattedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Fout",
        description: "Kon forum kamers niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async (roomId: string) => {
    try {
      setLoading(true);
      
      // Get class_id for the selected level
      const { data: levelData, error: levelError } = await supabase
        .from('niveaus')
        .select('class_id')
        .eq('id', roomId)
        .single();

      if (levelError) throw levelError;

      const { data, error } = await supabase
        .from('forum_threads')
        .select(`
          *,
          profiles:author_id (
            full_name,
            role
          )
        `)
        .eq('class_id', levelData.class_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add null safety for thread authors
      const threadsWithSafeAuthors = (data || []).map(thread => ({
        ...thread,
        profiles: thread.profiles ? {
          full_name: thread.profiles.full_name || 'Onbekende gebruiker',
          role: thread.profiles.role || 'leerling'
        } : {
          full_name: 'Onbekende gebruiker',
          role: 'leerling'
        }
      }));
      
      setThreads(threadsWithSafeAuthors);
      setSelectedRoom(roomId);
      setView('threads');
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({
        title: "Fout",
        description: "Kon forum onderwerpen niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !selectedRoom) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('forum_threads')
        .insert({
          title: newThreadTitle,
          content: newThreadContent,
          author_id: profile?.id,
          class_id: classId
        });

      if (error) throw error;

      setNewThreadTitle('');
      setNewThreadContent('');
      fetchThreads(selectedRoom);
      
      toast({
        title: "Succes",
        description: "Onderwerp aangemaakt"
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Fout",
        description: "Kon onderwerp niet aanmaken",
        variant: "destructive"
      });
    }
  };

  const selectThread = (threadId: string) => {
    setSelectedThread(threadId);
    setView('posts');
  };

  const goBackToRooms = () => {
    setView('rooms');
    setSelectedRoom('');
    setThreads([]);
  };

  const goBackToThreads = () => {
    setView('threads');
    setSelectedThread('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // Show forum rooms
  if (view === 'rooms') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Forum Kamers</h2>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Geen kamers beschikbaar"
            description="Er zijn nog geen forum kamers voor deze klas."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => fetchThreads(room.id)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hash className="h-5 w-5" />
                    {room.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {room.class_name}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {room.level_name}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show threads in selected room
  if (view === 'threads') {
    const currentRoom = rooms.find(r => r.id === selectedRoom);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={goBackToRooms}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Kamers
            </Button>
            <div>
              <h2 className="text-xl font-semibold">{currentRoom?.name}</h2>
              <p className="text-sm text-muted-foreground">{currentRoom?.class_name}</p>
            </div>
          </div>
        </div>

        {/* Create new thread form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nieuw Onderwerp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Titel van het onderwerp"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
            />
            <Textarea
              placeholder="Beschrijf je onderwerp..."
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              rows={4}
            />
            <Button onClick={createThread}>
              <Send className="h-4 w-4 mr-2" />
              Onderwerp Plaatsen
            </Button>
          </CardContent>
        </Card>

        {/* Threads list */}
        {threads.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Nog geen onderwerpen"
            description="Wees de eerste om een onderwerp te plaatsen in deze kamer!"
          />
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card key={thread.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectThread(thread.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {thread.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            Vastgepind
                          </Badge>
                        )}
                        {thread.title}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Door {thread.profiles?.full_name || 'Onbekende gebruiker'} • {new Date(thread.created_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {thread.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show posts in selected thread
  if (view === 'posts') {
    const currentThread = threads.find(t => t.id === selectedThread);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={goBackToThreads}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Onderwerpen
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{currentThread?.title}</h2>
            <p className="text-sm text-muted-foreground">
              Door {currentThread?.profiles?.full_name || 'Onbekende gebruiker'}
            </p>
          </div>
        </div>

        <ForumPostsList
          threadId={selectedThread}
          classId={classId}
        />
      </div>
    );
  }

  return null;
};

export default ForumMain;
