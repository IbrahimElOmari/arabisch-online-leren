
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
import { organizePosts } from '@/utils/forumUtils';

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
  const { profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [threadId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      console.log('ForumPostsList: Fetching posts for thread:', threadId);
      
      // Remove the is_verwijderd filter to get all posts including deleted ones
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
      
      // Add null safety for profiles data
      const safeFlat = flat.map(post => ({
        ...post,
        profiles: post.profiles ? {
          full_name: post.profiles.full_name || 'Onbekende gebruiker',
          role: post.profiles.role || 'leerling'
        } : {
          full_name: 'Onbekende gebruiker',
          role: 'leerling'
        }
      }));
      
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
    if (!replyContent.trim()) {
      toast({
        title: "Fout",
        description: "Vul een bericht in",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'create-post',
          threadId: threadId,
          content: replyContent
        }
      });

      if (error) throw error;

      setReplyContent('');
      fetchPosts();
      
      toast({
        title: "Succes",
        description: "Reactie geplaatst"
      });
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: "Fout",
        description: "Kon reactie niet plaatsen",
        variant: "destructive"
      });
    }
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
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Schrijf je reactie..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
          />
          <Button onClick={createReply}>
            <Send className="h-4 w-4 mr-2" />
            Reactie Plaatsen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumPostsList;
