import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { forumService } from '@/services/forumServiceEdge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Plus, ThumbsUp, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ForumPost } from '@/types/forum';

export const ClassForumPage = () => {
  const { t } = useTranslation();
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => {
    loadPosts();
  }, [classId]);

  const loadPosts = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const data = await forumService.listPosts({ class_id: classId });
      setPosts(data);
    } catch (error) {
      console.error('Failed to load forum posts:', error);
      toast({
        title: t('error', 'Error'),
        description: t('forum.loadFailed', 'Failed to load forum posts'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!classId || !newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: t('error', 'Error'),
        description: t('forum.fillRequired', 'Please fill in all required fields'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreating(true);
      await forumService.createPost({
        class_id: classId,
        title: newPost.title,
        content: newPost.content
      });
      
      toast({
        title: t('success', 'Success'),
        description: t('forum.postCreated', 'Post created successfully')
      });

      setNewPost({ title: '', content: '' });
      setDialogOpen(false);
      loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: t('error', 'Error'),
        description: t('forum.createFailed', 'Failed to create post'),
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await forumService.updatePost(postId, {
        likes_count: (posts.find(p => p.id === postId)?.likes_count || 0) + 1
      });
      loadPosts();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleReportPost = async (postId: string) => {
    try {
      await forumService.updatePost(postId, { is_reported: true });
      toast({
        title: t('success', 'Success'),
        description: t('forum.reported', 'Post reported successfully')
      });
      loadPosts();
    } catch (error) {
      console.error('Failed to report post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('forum.title', 'Class Forum')}</h1>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('forum.newPost', 'New Post')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('forum.createPost', 'Create New Post')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder={t('forum.titlePlaceholder', 'Post title...')}
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Textarea
                  placeholder={t('forum.contentPlaceholder', 'Post content...')}
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>
              <Button onClick={handleCreatePost} disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('forum.creating', 'Creating...')}
                  </>
                ) : (
                  t('forum.create', 'Create Post')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('forum.noPosts', 'No posts yet. Be the first to start a discussion!')}</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>
                  {t('forum.postedBy', 'Posted by')} {post.author_name || t('forum.anonymous', 'Anonymous')} • {new Date(post.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{post.content}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLikePost(post.id)}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {post.likes_count || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReportPost(post.id)}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    {t('forum.report', 'Report')}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {post.replies_count || 0} {t('forum.replies', 'replies')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
