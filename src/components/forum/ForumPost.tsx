import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Trash2, 
  Flag, 
  Send,
  Pin,
  MessageCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ForumPostProps {
  post: {
    id: string;
    titel: string;
    inhoud: string;
    author_id: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    dislikes_count: number;
    thread_id?: string;
    parent_post_id?: string;
    is_verwijderd: boolean;
    class_id: string;
    niveau_id?: string;
    profiles?: {
      full_name: string;
      role: string;
    };
  };
  onReply?: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string, isLike: boolean) => void;
  replies?: any[];
  showReplies?: boolean;
  isReply?: boolean;
}

export function ForumPost({ 
  post, 
  onReply, 
  onDelete, 
  onLike, 
  replies = [],
  showReplies = true,
  isReply = false
}: ForumPostProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize content/labels so component works with both schemas
  const displayTitle = (post as any).titel ?? (post as any).title ?? '';
  const displayContent = (post as any).inhoud ?? (post as any).content ?? '';
  const likeCount = (post as any).likes_count ?? 0;
  const dislikeCount = (post as any).dislikes_count ?? 0;

  const canDelete = user && (
    post.author_id === user.id || 
    profile?.role === 'admin' || 
    profile?.role === 'leerkracht'
  );

  const canModerate = profile?.role === 'admin' || profile?.role === 'leerkracht';

  const handleReply = async () => {
    if (!replyContent.trim() || !user || !post.thread_id) return;

    setIsSubmitting(true);
    try {
      console.log('Creating reply with:', {
        action: 'create-post',
        threadId: post.thread_id,
        content: replyContent,
        parentPostId: post.id
      });

      const { error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'create-post',
          threadId: post.thread_id,
          content: replyContent,
          parentPostId: post.id
        }
      });

      if (error) throw error;

      toast({
        title: "Reactie geplaatst",
        description: "Je reactie is succesvol geplaatst"
      });

      setReplyContent('');
      setShowReplyForm(false);
      
      if (onReply) {
        onReply(post.id, replyContent);
      }
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast({
        title: "Fout",
        description: "Kon reactie niet plaatsen",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (isLike: boolean) => {
    if (!user || !onLike) return;
    
    try {
      const { data: existingLike } = await supabase
        .from('forum_likes')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        if (existingLike.is_like === isLike) {
          await supabase
            .from('forum_likes')
            .delete()
            .eq('id', existingLike.id);
        } else {
          await supabase
            .from('forum_likes')
            .update({ is_like: isLike })
            .eq('id', existingLike.id);
        }
      } else {
        await supabase
          .from('forum_likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            is_like: isLike
          });
      }

      onLike(post.id, isLike);
      
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Fout",
        description: "Kon like niet toevoegen",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    if (!canDelete || !onDelete) return;
    
    if (confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) {
      onDelete(post.id);
    }
  };

  const handleReport = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'report-post',
          postId: post.id
        }
      });

      if (error) throw error;

      toast({
        title: "Gerapporteerd",
        description: "Dit bericht is gerapporteerd voor moderatie"
      });
    } catch (error) {
      console.error('Error reporting post:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet rapporteren",
        variant: "destructive"
      });
    }
  };

  if (post.is_verwijderd) {
    return (
      <Card className={`${isReply ? 'ml-8 border-l-4 border-l-muted' : ''} opacity-60`}>
        <CardContent className="pt-4">
          <p className="text-muted-foreground italic">Dit bericht is verwijderd</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className={isReply ? 'ml-8 border-l-4 border-l-primary/20' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {post.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">
                    {post.profiles?.full_name || 'Onbekende gebruiker'}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {post.profiles?.role === 'admin' ? 'Admin' : 
                     post.profiles?.role === 'leerkracht' ? 'Leerkracht' : 'Leerling'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: nl 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {canModerate && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Pin className="h-4 w-4" />
                </Button>
              )}
              {post.author_id !== user?.id && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={handleReport}
                >
                  <Flag className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isReply && displayTitle && (
            <h3 className="font-semibold text-lg">{displayTitle}</h3>
          )}
          
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{displayContent}</p>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleLike(true)}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{likeCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleLike(false)}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{dislikeCount}</span>
              </Button>
              
              {replies.length > 0 && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {replies.length} reactie{replies.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-2"
              >
                <Reply className="h-4 w-4" />
                Reageren
              </Button>
            )}
          </div>
          
          {showReplyForm && (
            <div className="space-y-3 pt-4 border-t">
              <Textarea
                placeholder="Schrijf je reactie..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  Annuleren
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Bezig...' : 'Versturen'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showReplies && replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <ForumPost
              key={reply.id}
              post={reply}
              onDelete={onDelete}
              onLike={onLike}
              onReply={onReply}
              isReply={true}
              showReplies={true}
              replies={reply.replies || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
