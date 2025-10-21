
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
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
}

const ForumPostsList = ({ threadId }: ForumPostsListProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
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
      
      if (import.meta.env.DEV) {
        console.log('ForumPostsList: Fetching posts for thread:', threadId);
      }
      
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
      
      if (import.meta.env.DEV) {
        console.log('ForumPostsList: Raw posts data:', data?.length || 0, 'posts');
      }
      
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
      if (import.meta.env.DEV) {
        console.log('ForumPostsList: Organized posts:', organized.length, 'root posts');
      }
      
      setPosts(organized as any);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: t('common.error'),
          description: "Kon berichten niet laden",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const createReply = async () => {
      if (!user) {
        toast({
          title: t('error.unauthorized'),
          description: "Je moet ingelogd zijn om een reactie te plaatsen",
          variant: "destructive"
        });
        return;
      }

      if (!threadId) {
        toast({
          title: t('common.error'),
          description: "Geen thread gevonden om een reactie te plaatsen",
          variant: "destructive"
        });
        return;
      }

      if (!replyContent.trim()) {
        toast({
          title: t('common.error'),
          description: t('error.required_field'),
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          throw new Error('Geen geldige sessie gevonden. Log opnieuw in.');
        }

        const accessToken = sessionData.session.access_token;
        
        if (import.meta.env.DEV) {
          console.log('Creating reply with edge function...', {
            threadId,
            contentLength: replyContent.length,
            hasToken: !!accessToken
          });
        }

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

        if (import.meta.env.DEV) {
          console.log('Edge function response:', { functionData, functionError });
        }

        if (functionError) {
          console.warn('Edge function failed, trying fallback...', functionError);
          await createReplyFallback();
          return;
        }

        if (functionData?.error) {
          console.warn('Edge function returned error, trying fallback...', functionData.error);
          await createReplyFallback();
          return;
        }

        if (import.meta.env.DEV) {
          console.log('Reply created successfully via edge function');
        }
        setReplyContent('');
        fetchPosts();
        
        toast({
          title: t('common.success'),
          description: "Reactie geplaatst"
        });

      } catch (error) {
        console.error('Error in createReply:', error);
        
        try {
          await createReplyFallback();
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          toast({
            title: t('common.error'),
            description: `Kon reactie niet plaatsen: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
            variant: "destructive"
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    };

  const createReplyFallback = async () => {
    if (import.meta.env.DEV) {
      console.log('Attempting fallback direct insert...');
    }
    
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('class_id')
      .eq('id', threadId)
      .single();

    if (threadError) {
      throw new Error(`Kon thread niet vinden: ${threadError.message}`);
    }

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

    if (import.meta.env.DEV) {
      console.log('Fallback insert successful');
    }
      setReplyContent('');
      fetchPosts();
      
      toast({
        title: t('common.success'),
        description: "Reactie geplaatst (via fallback)"
      });
    };

    const handleLike = async (postId: string, isLike: boolean) => {
      try {
        if (!profile?.id) return;
        
        const { error } = await supabase
          .from('forum_likes')
          .upsert([{
            post_id: postId,
            user_id: profile.id,
            is_like: isLike
          }], {
            onConflict: 'post_id,user_id'
          });

        if (error) throw error;
        
        fetchPosts();
      } catch (error) {
        console.error('Error liking post:', error);
        toast({
          title: t('common.error'),
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
          title: t('common.success'),
          description: "Bericht verwijderd"
        });
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({
          title: t('common.error'),
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
      {posts.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title={t('forum.noMessages')}
            description={t('forum.beFirst')}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t('forum.reply')}
            {!canReply && (
              <span className="text-sm text-muted-foreground font-normal">
                {t('forum.mustLogin')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={canReply ? t('forum.writePlaceholder') : t('forum.loginPlaceholder')}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            disabled={!canReply}
          />
          <Button 
            onClick={createReply}
            disabled={!canReply || !replyContent.trim() || isSubmitting}
          >
            <Send className="h-4 w-4 me-2" />
            {isSubmitting ? t('forum.posting') : t('forum.postReply')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumPostsList;
