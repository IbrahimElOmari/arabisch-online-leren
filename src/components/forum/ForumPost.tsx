import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useToast } from '@/hooks/use-toast';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useUserRole } from '@/hooks/useUserRole';
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
import { nl, ar } from 'date-fns/locale';

interface ForumPostProps {
  post: {
    id: string;
    titel?: string;
    title?: string;
    inhoud?: string;
    content?: string;
    author_id: string;
    created_at: string;
    updated_at?: string;
    likes_count?: number;
    dislikes_count?: number;
    thread_id?: string;
    parent_post_id?: string;
    is_verwijderd?: boolean;
    class_id?: string;
    niveau_id?: string;
    profiles?: {
      full_name: string;
      role: string;
    };
    author?: {
      full_name: string;
      role?: string;
    };
  };
  onReply?: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string, isLike: boolean) => void;
  replies?: any[];
  showReplies?: boolean;
  isReply?: boolean;
  nestingLevel?: number;
}

export function ForumPost({ 
  post, 
  onReply, 
  onDelete, 
  onLike, 
  replies = [],
  showReplies = true,
  isReply = false,
  nestingLevel = 0
}: ForumPostProps) {
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const { toast } = useToast();
  const { getFlexDirection, getTextAlign, getMarginStart, getMarginEnd } = useRTLLayout();
  const { t, language } = useTranslation();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayTitle = post.title ?? post.titel ?? '';
  const displayContent = post.content ?? post.inhoud ?? '';
  const likeCount = post.likes_count ?? 0;
  const dislikeCount = post.dislikes_count ?? 0;
  const authorName = post.profiles?.full_name ?? post.author?.full_name ?? 'Onbekende gebruiker';
  const authorRole = post.profiles?.role ?? post.author?.role ?? 'leerling';

  const maxNestingLevel = Math.min(nestingLevel, 4);
  const marginLeft = maxNestingLevel > 0 ? `${maxNestingLevel * 2}rem` : '0';

  const canDelete = user && (
    post.author_id === user.id || 
    isAdmin || 
    isTeacher
  );

  const canModerate = isAdmin || isTeacher;

  const handleReply = async () => {
    if (!user) {
      toast({
        title: t('error.unauthorized'),
        description: t('forum.mustLogin').replace('(', '').replace(')', ''),
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

    if (!post.thread_id) {
      toast({
        title: t('common.error'),
        description: "Geen thread gevonden voor deze reactie",
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

      console.log('Creating nested reply with edge function...', {
        threadId: post.thread_id,
        parentPostId: post.id,
        hasToken: !!accessToken
      });

      const { data: functionData, error: functionError } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'create-post',
          threadId: post.thread_id,
          content: replyContent,
          parentPostId: post.id
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (functionError || functionData?.error) {
        console.warn('Edge function failed for reply, trying fallback...', functionError || functionData?.error);
        await createReplyFallback();
        return;
      }

      toast({
        title: t('common.success'),
        description: "Je reactie is succesvol geplaatst"
      });

      setReplyContent('');
      setShowReplyForm(false);
      
      if (onReply) {
        onReply(post.id, replyContent);
      }
      
    } catch (error: any) {
      console.error('Error posting reply:', error);
      
      try {
        await createReplyFallback();
      } catch (fallbackError) {
        console.error('Reply fallback failed:', fallbackError);
        toast({
          title: "Fout",
          description: `Kon reactie niet plaatsen: ${error.message || 'Onbekende fout'}`,
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const createReplyFallback = async () => {
    console.log('Attempting reply fallback...');
    
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('class_id')
      .eq('id', post.thread_id!)
      .single();

    if (threadError) {
      throw new Error(`Kon thread niet vinden: ${threadError.message}`);
    }

    const { error: insertError } = await supabase
      .from('forum_posts')
      .insert({
        thread_id: post.thread_id!,
        author_id: user!.id,
        titel: 'Reactie',
        inhoud: replyContent,
        parent_post_id: post.id,
        class_id: thread.class_id,
        is_verwijderd: false
      });

    if (insertError) {
      throw new Error(`Reactie insert mislukt: ${insertError.message}`);
    }

    console.log('Reply fallback successful');
    
    toast({
      title: "Reactie geplaatst",
      description: "Je reactie is succesvol geplaatst (via fallback)"
    });

    setReplyContent('');
    setShowReplyForm(false);
    
    if (onReply) {
      onReply(post.id, replyContent);
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
      <div style={{ marginLeft }}>
        <Card className={`opacity-60 ${maxNestingLevel > 0 ? 'border-l-4 border-l-muted' : ''}`}>
          <CardContent className="pt-4">
            <p className="text-muted-foreground italic">Dit bericht is verwijderd</p>
            {showReplies && replies.length > 0 && (
              <div className="mt-4 space-y-3">
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
                    nestingLevel={nestingLevel + 1}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ marginLeft }}>
      <Card className={maxNestingLevel > 0 ? 'border-l-4 border-l-primary/20' : ''}>
        <CardHeader className="pb-3">
          <div className={`flex items-start justify-between ${getFlexDirection()}`}>
            <div className={`flex items-center gap-3 ${getFlexDirection()}`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {authorName.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                  <h4 className={`font-medium text-sm ${getTextAlign()}`}>
                    {authorName}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {authorRole === 'admin' ? 'Admin' : 
                     authorRole === 'leerkracht' ? 'Leerkracht' : 'Leerling'}
                  </Badge>
                  {nestingLevel > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {t('forum.reply')}
                  </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: language === 'ar' ? ar : nl 
                  })}
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-1 ${getFlexDirection()}`}>
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
          
          <div className={`flex items-center justify-between pt-2 border-t ${getFlexDirection()}`}>
            <div className={`flex items-center gap-4 ${getFlexDirection()}`}>
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
                  {replies.length} {replies.length === 1 ? t('forum.replyCount') : t('forum.replyCount') + t('forum.repliesCount')}
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
                {t('forum.reply')}
              </Button>
            )}
          </div>
          
          {showReplyForm && (
            <div className="space-y-3 pt-4 border-t">
              <Textarea
                placeholder={t('forum.writeReply')}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className={`flex justify-end gap-2 ${getFlexDirection()}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  {t('forum.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? t('forum.posting') : t('forum.send')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
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
              nestingLevel={nestingLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
