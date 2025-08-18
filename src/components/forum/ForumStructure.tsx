import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useForumStore } from '@/hooks/useForumStore';
import { useToast } from '@/hooks/use-toast';
import { useForumRealtime } from '@/hooks/useForumRealtime';
import { 
  MessageSquare, 
  Plus, 
  Pin, 
  Heart,
  Reply,
  ArrowLeft,
  Users,
  Hash,
  Trash2,
  Flag
} from 'lucide-react';

interface Class {
  id: string;
  name: string;
  niveaus: Array<{
    id: string;
    naam: string;
    niveau_nummer: number;
  }>;
}

interface ForumStructureProps {
  classId: string;
}

const ForumStructure: React.FC<ForumStructureProps> = ({ classId }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [view, setView] = useState<'classes' | 'niveaus' | 'threads' | 'posts'>('classes');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyToPost, setReplyToPost] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    threads,
    posts,
    selectedThread,
    fetchThreads,
    createThread,
    fetchPosts,
    createPost,
    deletePost,
    reportPost,
    likePost,
    pinThread,
    toggleComments,
    setSelectedThread,
    loading: forumLoading
  } = useForumStore();

  useEffect(() => {
    fetchAccessibleClasses();
  }, [profile]);

  useEffect(() => {
    if (classId && view === 'classes') {
      // Auto-select class if provided
      const foundClass = classes.find(c => c.id === classId);
      if (foundClass) {
        setSelectedClass(foundClass);
        setView('niveaus');
      }
    }
  }, [classId, classes, view]);

  // When in thread posts view, subscribe to realtime updates so replies appear immediately
  const refreshPosts = useCallback(() => {
    if (selectedThread?.id) {
      console.log('[ForumStructure] Realtime refresh for thread:', selectedThread.id);
      fetchPosts(selectedThread.id);
    }
  }, [selectedThread?.id, fetchPosts]);

  useForumRealtime(view === 'posts' && selectedThread ? selectedThread.id : null, refreshPosts);

  const fetchAccessibleClasses = async () => {
    try {
      let query = supabase.from('klassen').select(`
        id,
        name,
        niveaus (
          id,
          naam,
          niveau_nummer
        )
      `);

      if (profile?.role === 'admin') {
        // Admin sees all classes
        query = query.order('name');
      } else if (profile?.role === 'leerkracht') {
        // Teacher sees assigned classes
        query = query.eq('teacher_id', profile.id);
      } else {
        // Students see enrolled classes
        const { data: enrollments } = await supabase
          .from('inschrijvingen')
          .select('class_id')
          .eq('student_id', profile?.id)
          .eq('payment_status', 'paid');

        const classIds = enrollments?.map(e => e.class_id) || [];
        if (classIds.length === 0) {
          setClasses([]);
          setLoading(false);
          return;
        }
        query = query.in('id', classIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Fout",
        description: "Kon klassen niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (klas: Class) => {
    setSelectedClass(klas);
    setView('niveaus');
  };

  const handleNiveauSelect = (niveauId: string) => {
    setSelectedNiveau(niveauId);
    setView('threads');
    // Use the selected class ID for fetching threads
    if (selectedClass?.id) {
      fetchThreads(selectedClass.id);
    }
  };

  const handleThreadSelect = (thread: any) => {
    setSelectedThread(thread);
    setView('posts');
    fetchPosts(thread.id);
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      toast({
        title: "Fout",
        description: "Titel en inhoud zijn verplicht",
        variant: "destructive"
      });
      return;
    }

    const success = await createThread(selectedClass?.id || '', newThreadTitle, newThreadContent);
    if (success) {
      setNewThreadTitle('');
      setNewThreadContent('');
      toast({
        title: "Succes",
        description: "Onderwerp aangemaakt"
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Fout",
        description: "Bericht inhoud is verplicht",
        variant: "destructive"
      });
      return;
    }

    console.log('[ForumStructure] Submitting post', {
      threadId: selectedThread?.id,
      replyingTo: replyToPost ?? null
    });

    const success = await createPost(selectedThread?.id || '', newPostContent, replyToPost || undefined);
    if (success && selectedThread?.id) {
      // Force a refresh to avoid any realtime race conditions
      await fetchPosts(selectedThread.id);
      setNewPostContent('');
      setReplyToPost(null);
      toast({
        title: "Succes",
        description: "Bericht geplaatst"
      });
    } else if (!success) {
      toast({
        title: "Fout",
        description: "Kon bericht niet plaatsen",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const success = await deletePost(postId);
    if (success) {
      toast({
        title: "Succes",
        description: "Bericht verwijderd"
      });
    }
  };

  const handleReportPost = async (postId: string) => {
    const success = await reportPost(postId);
    if (success) {
      toast({
        title: "Succes",
        description: "Bericht gerapporteerd"
      });
    }
  };

  const renderPost = (post: any, isReply: boolean = false) => {
    // Handle deleted posts with placeholder
    if (post.is_verwijderd) {
      return (
        <div key={post.id} className={`border border-border rounded-lg p-4 bg-muted/30 ${isReply ? 'ml-6 mt-2' : 'mb-4'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-xs text-muted-foreground">?</span>
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground">Verwijderde gebruiker</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString('nl-NL')}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">Dit bericht is verwijderd</p>
          
          {/* Still show replies to deleted posts */}
          {post.replies && post.replies.map((reply: any) => renderPost(reply, true))}
        </div>
      );
    }

    return (
      <div key={post.id} className={`border border-border rounded-lg p-4 ${isReply ? 'ml-6 mt-2' : 'mb-4'}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              {(post.author?.full_name || 'U').charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{post.author?.full_name || 'Onbekende gebruiker'}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString('nl-NL')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(profile?.role === 'admin' || profile?.role === 'leerkracht' || post.author_id === profile?.id) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeletePost(post.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {post.author_id !== profile?.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReportPost(post.id)}
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          <p className="text-sm">{post.content}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likePost(post.id, true)}
            className="flex items-center gap-1"
          >
            <Heart className="h-4 w-4" />
            Like
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyToPost(post.id)}
            className="flex items-center gap-1"
          >
            <Reply className="h-4 w-4" />
            Reageren
          </Button>
        </div>
        
        {post.replies && post.replies.map((reply: any) => renderPost(reply, true))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  // Classes view
  if (view === 'classes') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Forum - Klassen</h2>
        </div>
        
        {classes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Geen toegang tot forum klassen
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((klas) => (
              <Card 
                key={klas.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleClassSelect(klas)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    {klas.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-3">
                    {klas.niveaus?.length || 0} niveaus beschikbaar
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Open Forum →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Niveaus view
  if (view === 'niveaus' && selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            onClick={() => setView('classes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar Klassen
          </Button>
          <h2 className="text-xl font-semibold">Forum - {selectedClass.name}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedClass.niveaus?.map((niveau) => (
            <Card 
              key={niveau.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleNiveauSelect(niveau.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {niveau.naam}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-3">
                  Niveau {niveau.niveau_nummer}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Open Forum →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Threads view
  if (view === 'threads' && selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setView('niveaus')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug naar Niveaus
            </Button>
            <h2 className="text-xl font-semibold">Forum Onderwerpen</h2>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nieuw Onderwerp
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuw Onderwerp Aanmaken</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="Onderwerp titel..."
                  />
                </div>
                <div>
                  <Label htmlFor="content">Inhoud</Label>
                  <Textarea
                    id="content"
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="Onderwerp inhoud..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateThread} className="w-full">
                  Onderwerp Aanmaken
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-4">
          {forumLoading ? (
            <div className="text-center py-8">Laden...</div>
          ) : threads.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nog geen onderwerpen. Maak het eerste onderwerp aan!
                </p>
              </CardContent>
            </Card>
          ) : (
            threads.map((thread) => (
              <Card 
                key={thread.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleThreadSelect(thread)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {thread.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                        {thread.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Door {thread.author?.full_name || 'Onbekende gebruiker'} • {new Date(thread.created_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!thread.comments_enabled && (
                        <Badge variant="secondary">Gesloten</Badge>
                      )}
                      <Badge variant="outline">
                        {thread.post_count || 0} reacties
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {thread.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Posts view
  if (view === 'posts' && selectedThread) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            onClick={() => setView('threads')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar Onderwerpen
          </Button>
          <h2 className="text-xl font-semibold">{selectedThread.title}</h2>
          {selectedThread.is_pinned && <Pin className="h-5 w-5 text-primary" />}
        </div>
        
        {/* Thread content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                {(selectedThread.author?.full_name || 'U').charAt(0)}
              </div>
              <div>
                <p className="font-medium">{selectedThread.author?.full_name || 'Onbekende gebruiker'}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedThread.created_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">{selectedThread.content}</p>
            {(profile?.role === 'admin' || profile?.role === 'leerkracht') && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pinThread(selectedThread.id, !selectedThread.is_pinned)}
                >
                  <Pin className="h-4 w-4 mr-1" />
                  {selectedThread.is_pinned ? 'Losmaken' : 'Vastpinnen'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleComments(selectedThread.id, !selectedThread.comments_enabled)}
                >
                  {selectedThread.comments_enabled ? 'Reacties Sluiten' : 'Reacties Openen'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Posts */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Reacties</h3>
          {forumLoading ? (
            <div className="text-center py-4">Laden...</div>
          ) : (
            <div>
              {posts.map((post) => renderPost(post))}
              
              {selectedThread.comments_enabled && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {replyToPost && (
                        <div className="text-sm text-muted-foreground">
                          Reageren op bericht...
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyToPost(null)}
                            className="ml-2"
                          >
                            Annuleren
                          </Button>
                        </div>
                      )}
                      <Textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Schrijf je reactie..."
                        rows={3}
                      />
                      <Button onClick={handleCreatePost}>
                        Reactie Plaatsen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ForumStructure;
