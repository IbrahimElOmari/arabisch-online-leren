import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Eye
} from 'lucide-react';

interface ForumRoom {
  id: string;
  name: string;
  description: string;
  class_name: string;
  thread_count: number;
  post_count: number;
}

const AdminForumStructure = () => {
  const [rooms, setRooms] = useState<ForumRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [roomModal, setRoomModal] = useState({ open: false, mode: 'create', room: null as any });
  const { toast } = useToast();

  useEffect(() => {
    fetchForumStructure();
  }, []);

  const fetchForumStructure = async () => {
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select(`
          id,
          name,
          description,
          niveaus (
            id,
            naam,
            beschrijving
          )
        `);

      if (error) throw error;

      // Transform data to forum rooms structure
      const roomData: ForumRoom[] = [];
      
      for (const klas of data || []) {
        for (const niveau of klas.niveaus || []) {
          // Get thread and post counts
          const { data: threadCount } = await supabase
            .from('forum_threads')
            .select('id', { count: 'exact' })
            .eq('class_id', klas.id);

          const { data: postCount } = await supabase
            .from('forum_posts')
            .select('id', { count: 'exact' })
            .eq('class_id', klas.id)
            .eq('niveau_id', niveau.id);

          roomData.push({
            id: `${klas.id}-${niveau.id}`,
            name: `${klas.name} - ${niveau.naam}`,
            description: niveau.beschrijving || klas.description || '',
            class_name: klas.name,
            thread_count: threadCount?.length || 0,
            post_count: postCount?.length || 0
          });
        }
      }

      setRooms(roomData);
    } catch (error) {
      console.error('Error fetching forum structure:', error);
      toast({
        title: "Fout",
        description: "Kon forumstructuur niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (roomData: { name: string; description: string }) => {
    try {
      // This would create a new class/niveau combination
      // For now, we'll show a message that this requires class management
      toast({
        title: "Info",
        description: "Nieuwe forumkamers worden aangemaakt via klassenbeheer",
        variant: "default"
      });
      setRoomModal({ open: false, mode: 'create', room: null });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Fout",
        description: "Kon kamer niet aanmaken",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Weet je zeker dat je deze forumkamer wilt verwijderen?")) return;

    try {
      const [classId, niveauId] = roomId.split('-');
      
      // Delete all posts and threads for this room
      await supabase
        .from('forum_posts')
        .delete()
        .eq('class_id', classId)
        .eq('niveau_id', niveauId);

      await supabase
        .from('forum_threads')
        .delete()
        .eq('class_id', classId);

      toast({
        title: "Succes",
        description: "Forumkamer verwijderd"
      });
      
      fetchForumStructure();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Fout",
        description: "Kon kamer niet verwijderen",
        variant: "destructive"
      });
    }
  };

  const RoomModal = () => (
    <Dialog open={roomModal.open} onOpenChange={(open) => setRoomModal(prev => ({ ...prev, open }))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {roomModal.mode === 'create' ? 'Nieuwe Forumkamer' : 'Kamer Bewerken'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Naam</label>
            <Input 
              placeholder="Bijv. Arabisch Beginners - Niveau 1"
              defaultValue={roomModal.room?.name || ''}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Beschrijving</label>
            <Textarea 
              placeholder="Beschrijving van de forumkamer..."
              defaultValue={roomModal.room?.description || ''}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleCreateRoom({ name: '', description: '' })}>
              {roomModal.mode === 'create' ? 'Aanmaken' : 'Opslaan'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setRoomModal({ open: false, mode: 'create', room: null })}
            >
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-lg">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Forum Structuur & Moderatie
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setRoomModal({ open: true, mode: 'create', room: null })}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nieuwe Kamer
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nog geen forumkamers beschikbaar
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-2">{room.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {room.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {room.thread_count} threads
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {room.post_count} posts
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRoom(room.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Bekijk
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setRoomModal({ 
                            open: true, 
                            mode: 'edit', 
                            room: room 
                          })}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Bewerk
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Verwijder
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RoomModal />
    </div>
  );
};

export default AdminForumStructure;