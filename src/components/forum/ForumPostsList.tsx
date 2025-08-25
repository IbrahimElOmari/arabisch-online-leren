import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { ForumPost } from './ForumPost';
import { 
  Send,
  MessageCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { organizePosts, normalizePost } from '@/utils/forumUtils';

interface Post {
  id: string;
  titel?: string | null;
  title?: string | null;
  inhoud?: string | null;
  content?: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  thread_id: string;
  parent_post_id?: string | null;
  is_verwijderd: boolean;
  class_id: string;
  niveau_id?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  is_gerapporteerd?: boolean;
  verwijderd_door?: string | null;
  profiles?: {
    full_name: string;
    role: string;
  } | null;
}

interface ForumPostsListProps {
  threadId: string;
  classId: string;
}

const ForumPostsList = ({ threadId, classId }: ForumPostsListProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [threadId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      console.log('ForumPostsList: Fetching posts for thread:', threadId);
      
      // Get all posts including deleted ones to preserve reply structure
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:author_id (
            full_name,
            role
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      console.log('ForumPostsList: Raw posts data:', data?.length || 0, 'posts');
      
      const flat: Post[] = (data as any) || [];
      
      // Add null safety for profiles data and normalize all posts
      const safeFlat = flat.map(post => {
        const normalizedPost = normalizePost(post);
        return {
          ...normalizedPost,
          profiles: post.profiles ? {
            full_name: post.profiles.full_name || 'Onbekende gebruiker',
            role: post.profiles.role || 'leerling'
          } : {
            full_name: 'Onbekende gebruiker',
            role: 'leerling'
          }
        };
      });
      
      // Use the centralized organizePosts function with safe data
      const organized = organizePosts(safeFlat as any);
      console.log('ForumPostsList: Organized posts:', organized.length, 'root posts');
      
      setPosts(organized as any);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Fout",
        description: "Kon berichten niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createReply = async () => {
    // Early validation - check for user, session, and content
    if (!user) {
      toast({
        title: "Niet ingelogd",
        description: "Je moet ingelogd zijn om een reactie te plaatsen",
        variant: "destructive"
      });
      return;
    }

    if (!threadId) {
      toast({
        title: "Fout",
        description: "Geen thread gevonden om een reactie te plaatsen",
        variant: "destructive"
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Fout",
        description: "Vul een bericht in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get fresh session for authentication
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Geen geldige sessie gevonden. Log opnieuw in.');
      }

      const accessToken = sessionData.session.access_token;
      
      console.log('Creating reply with edge function...', {
        threadId,
        contentLength: replyContent.length,
        hasToken: !!accessToken
      });

      // Try edge function first with explicit authorization header
      const { data: functionData, error: functionError } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'create-post',
          threadId: threadId,
          content: replyContent
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      console.log('Edge function response:', { functionData, functionError });

      // Check for edge function errors
      if (functionError) {
        console.warn('Edge function failed, trying fallback...', functionError);
        
        // Fallback: direct insert to forum_posts
        await createReplyFallback();
        return;
      }

      // Check for application-level errors in function response
      if (functionData?.error) {
        console.warn('Edge function returned error, trying fallback...', functionData.error);
        await createReplyFallback();
        return;
      }

      // Success via edge function
      console.log('Reply created successfully via edge function');
      setReplyContent('');
      fetchPosts();
      
      toast({
        title: "Succes",
        description: "Reactie geplaatst"
      });

    } catch (error) {
      console.error('Error in createReply:', error);
      
      // Try fallback on any error
      try {
        await createReplyFallback();
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        toast({
          title: "Fout",
          description: `Kon reactie niet plaatsen: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const createReplyFallback = async () => {
    console.log('Attempting fallback direct insert...');
    
    // Get thread info for class_id
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('class_id')
      .eq('id', threadId)
      .single();

    if (threadError) {
      throw new Error(`Kon thread niet vinden: ${threadError.message}`);
    }

    // Direct insert to forum_posts table
    const { error: insertError } = await supabase
      .from('forum_posts')
      .insert({
        thread_id: threadId,
        author_id: user!.id,
        titel: 'Hoofdbericht',
        inhoud: replyContent,
        parent_post_id: null,
        class_id: thread.class_id,
        is_verwijderd: false
      });

    if (insertError) {
      throw new Error(`Directe insert mislukt: ${insertError.message}`);
    }

    console.log('Fallback insert successful');
    setReplyContent('');
    fetchPosts();
    
    toast({
      title: "Succes",
      description: "Reactie geplaatst (via fallback)"
    });
  };

  const handleLike = async (postId: string, isLike: boolean) => {
    try {
      const { error } = await supabase
        .from('forum_likes')
        .upsert({
          post_id: postId,
          user_id: profile?.id,
          is_like: isLike
        });

      if (error) throw error;
      
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Fout",
        description: "Kon waardering niet opslaan",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'delete-post',
          postId: postId
        }
      });

      if (error) throw error;
      
      fetchPosts();
      
      toast({
        title: "Succes",
        description: "Bericht verwijderd"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet verwijderen",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const canReply = user && threadId;

  return (
    <div className="space-y-6">
      {/* Posts list */}
      {posts.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nog geen berichten"
          description="Wees de eerste om een bericht te plaatsen!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <ForumPost
              key={post.id}
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
              onReply={() => fetchPosts()}
              replies={post.replies || []}
              nestingLevel={0}
            />
          ))}
        </div>
      )}

      {/* Reply form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Reageren
            {!canReply && (
              <span className="text-sm text-muted-foreground font-normal">
                (Je moet ingelogd zijn)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={canReply ? "Schrijf je reactie..." : "Log in om een reactie te plaatsen"}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            disabled={!canReply}
          />
          <Button 
            onClick={createReply}
            disabled={!canReply || !replyContent.trim() || isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Bezig...' : 'Reactie Plaatsen'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumPostsList;
