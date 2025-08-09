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

interface Post {
  id: string;
  titel: string;
  inhoud: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  thread_id: string;
  parent_post_id?: string;
  is_verwijderd: boolean;
  class_id: string;
  niveau_id?: string;
  media_type?: string;
  media_url?: string;
  is_gerapporteerd?: boolean;
  verwijderd_door?: string;
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [threadId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
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
        .eq('is_verwijderd', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const flatPosts = (data as any) || [];
      // Build nested replies structure
      const postMap = new Map<string, any>();
      flatPosts.forEach((p: any) => postMap.set(p.id, { ...p, replies: [] }));
      const roots: any[] = [];
      flatPosts.forEach((p: any) => {
        if (p.parent_post_id) {
          const parent = postMap.get(p.parent_post_id);
          if (parent) parent.replies.push(postMap.get(p.id));
        } else {
          roots.push(postMap.get(p.id));
        }
      });

      setPosts(roots as any);
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
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          titel: 'Reactie',
          inhoud: replyContent,
          author_id: profile?.id,
          thread_id: threadId,
          class_id: classId
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
      const { error } = await supabase
        .from('forum_posts')
        .update({ is_verwijderd: true })
        .eq('id', postId);

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