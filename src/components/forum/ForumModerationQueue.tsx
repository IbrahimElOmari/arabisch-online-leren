import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportedPost {
  id: string;
  titel: string;
  inhoud: string;
  created_at: string;
  author: {
    full_name: string;
    role: string;
  };
  class_name: string;
}

const ForumModerationQueue = () => {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportedPosts();
  }, []);

  const fetchReportedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          id,
          titel,
          inhoud,
          created_at,
          author_id,
          class_id,
          profiles!author_id (
            full_name,
            role
          ),
          klassen!class_id (
            name
          )
        `)
        .eq('is_gerapporteerd', true)
        .eq('is_verwijderd', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data?.map(post => ({
        id: post.id,
        titel: post.titel,
        inhoud: post.inhoud,
        created_at: post.created_at,
        author: {
          full_name: post.profiles?.full_name || 'Onbekend',
          role: post.profiles?.role || 'onbekend'
        },
        class_name: post.klassen?.name || 'Onbekende klas'
      })) || [];

      setReportedPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching reported posts:', error);
      toast({
        title: "Fout",
        description: "Kon gerapporteerde berichten niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeratePost = async (postId: string, action: 'approve' | 'delete') => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: action === 'approve' ? 'approve-post' : 'delete-post',
          postId: postId
        }
      });

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Bericht Goedgekeurd" : "Bericht Verwijderd",
        description: action === 'approve' 
          ? "Het bericht is goedgekeurd en zichtbaar voor gebruikers."
          : "Het bericht is verwijderd en niet meer zichtbaar.",
      });

      // Refresh the list
      fetchReportedPosts();
    } catch (error: any) {
      console.error('Error moderating post:', error);
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het modereren.",
        variant: "destructive",
      });
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Content Moderatie Wachtrij
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reportedPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Geen gerapporteerde berichten
          </div>
        ) : (
          <div className="space-y-4">
            {reportedPosts.map((post) => (
              <div key={post.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Gerapporteerd</Badge>
                    <span className="text-sm text-muted-foreground">
                      {post.class_name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModeratePost(post.id, 'approve')}
                    >
                      <CheckCircle className="h-4 w-4 me-1" />
                      Goedkeuren
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleModeratePost(post.id, 'delete')}
                    >
                      <XCircle className="h-4 w-4 me-1" />
                      Verwijderen
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">{post.titel}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.inhoud}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Door: {post.author.full_name} ({post.author.role}) • {' '}
                    {new Date(post.created_at).toLocaleDateString('nl-NL')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForumModerationQueue;