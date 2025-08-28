
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useToast } from '@/hooks/use-toast';
import ForumRooms from './ForumRooms';
import ForumThreads from './ForumThreads';
import CreateThreadForm from './CreateThreadForm';
import ForumPostsList from './ForumPostsList';
import { useForumRealtime } from '@/hooks/useForumRealtime';
import { 
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

  // Real-time updates for the selected thread
  useForumRealtime(selectedThread, () => {
    // Refresh posts when there are changes
    console.log('Forum realtime update detected');
  });

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

  const handleRoomSelect = (roomId: string) => {
    fetchThreads(roomId);
  };

  const handleThreadSelect = (threadId: string) => {
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
        <ForumRooms rooms={rooms} onRoomSelect={handleRoomSelect} />
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

        <CreateThreadForm
          title={newThreadTitle}
          content={newThreadContent}
          onTitleChange={setNewThreadTitle}
          onContentChange={setNewThreadContent}
          onSubmit={createThread}
        />

        <ForumThreads threads={threads} onThreadSelect={handleThreadSelect} />
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
