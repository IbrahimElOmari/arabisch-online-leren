import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Trash2,
  Flag,
  MessageSquare,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModerationItem {
  id: string;
  content_type: string;
  content_id: string;
  user_id: string;
  moderation_action: string;
  reason: string | null;
  moderator_id: string | null;
  automated: boolean;
  created_at: string;
  // Joined data
  content_title?: string;
  content_text?: string;
  author_name?: string;
  moderator_name?: string;
}

interface ForumPost {
  id: string;
  titel: string;
  inhoud: string;
  author_id: string;
  is_gerapporteerd: boolean;
  is_verwijderd: boolean;
  created_at: string;
  author_name?: string;
}

export const ContentModerationPanel = () => {
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const { toast } = useToast();

  const moderationReasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate', label: 'Ongepaste inhoud' },
    { value: 'harassment', label: 'Intimidatie' },
    { value: 'hate_speech', label: 'Haatdragend taalgebruik' },
    { value: 'off_topic', label: 'Off-topic' },
    { value: 'misinformation', label: 'Desinformatie' },
    { value: 'custom', label: 'Andere reden' }
  ];

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    try {
      setLoading(true);

      // Load moderation items
      const { data: moderation, error: moderationError } = await supabase
        .from('content_moderation')
        .select(`
          *,
          moderator:moderator_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (moderationError) throw moderationError;

      // Load reported posts
      const { data: posts, error: postsError } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:author_id(full_name)
        `)
        .eq('is_gerapporteerd', true)
        .eq('is_verwijderd', false)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      setModerationItems(moderation || []);
      setReportedPosts(posts || []);

    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon moderatiegegevens niet laden: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const moderateContent = async (
    contentType: string,
    contentId: string,
    action: 'approved' | 'rejected' | 'deleted',
    reason?: string
  ) => {
    try {
      // Record moderation action
      const { error: moderationError } = await supabase
        .from('content_moderation')
        .insert({
          content_type: contentType,
          content_id: contentId,
          user_id: reportedPosts.find(p => p.id === contentId)?.author_id || '',
          moderation_action: action,
          reason: reason || null,
          automated: false
        });

      if (moderationError) throw moderationError;

      // Update the content based on action
      if (contentType === 'forum_post') {
        const updates: any = { is_gerapporteerd: false };
        
        if (action === 'deleted') {
          updates.is_verwijderd = true;
        }

        const { error: updateError } = await supabase
          .from('forum_posts')
          .update(updates)
          .eq('id', contentId);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Succes',
        description: `Content ${action === 'approved' ? 'goedgekeurd' : action === 'rejected' ? 'afgewezen' : 'verwijderd'}`
      });

      loadModerationData();
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon moderatieactie niet uitvoeren: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const flagContent = async (contentType: string, contentId: string) => {
    try {
      const { error } = await supabase
        .from('content_moderation')
        .insert({
          content_type: contentType,
          content_id: contentId,
          user_id: reportedPosts.find(p => p.id === contentId)?.author_id || '',
          moderation_action: 'flagged',
          reason: 'Automated flag for review',
          automated: true
        });

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Content gemarkeerd voor review'
      });

      loadModerationData();
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon content niet markeren: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'deleted': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'flagged': return <Flag className="h-4 w-4 text-yellow-500" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'deleted': return 'destructive';
      case 'flagged': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Moderatiegegevens laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Content Moderatie</h2>
      </div>

      <Tabs defaultValue="reported" className="w-full">
        <TabsList>
          <TabsTrigger value="reported">Gerapporteerde Content</TabsTrigger>
          <TabsTrigger value="history">Moderatiegeschiedenis</TabsTrigger>
        </TabsList>

        <TabsContent value="reported">
          <Card>
            <CardHeader>
              <CardTitle>Te Modereren Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportedPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{post.author_name || 'Onbekende gebruiker'}</span>
                          <Badge variant="destructive" className="text-xs">
                            Gerapporteerd
                          </Badge>
                        </div>
                        <h3 className="font-medium mb-2">{post.titel}</h3>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {post.inhoud}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(post.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Select value={selectedReason} onValueChange={setSelectedReason}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Selecteer reden" />
                        </SelectTrigger>
                        <SelectContent>
                          {moderationReasons.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedReason === 'custom' && (
                        <Textarea
                          placeholder="Aangepaste reden..."
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          className="max-w-xs"
                        />
                      )}

                      <div className="flex gap-2 ms-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moderateContent(
                            'forum_post', 
                            post.id, 
                            'approved',
                            selectedReason === 'custom' ? customReason : selectedReason
                          )}
                        >
                          <CheckCircle className="h-4 w-4 me-1" />
                          Goedkeuren
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => moderateContent(
                            'forum_post', 
                            post.id, 
                            'rejected',
                            selectedReason === 'custom' ? customReason : selectedReason
                          )}
                        >
                          <XCircle className="h-4 w-4 me-1" />
                          Afwijzen
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => moderateContent(
                            'forum_post', 
                            post.id, 
                            'deleted',
                            selectedReason === 'custom' ? customReason : selectedReason
                          )}
                        >
                          <Trash2 className="h-4 w-4 me-1" />
                          Verwijderen
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {reportedPosts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Geen gerapporteerde content om te modereren
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Moderatiegeschiedenis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {moderationItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getActionIcon(item.moderation_action)}
                      <div>
                        <div className="font-medium">
                          {item.content_type} - {item.moderation_action}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.reason && `Reden: ${item.reason}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                          {item.moderator_name && ` door ${item.moderator_name}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(item.moderation_action)}>
                        {item.moderation_action}
                      </Badge>
                      {item.automated && (
                        <Badge variant="outline" className="text-xs">
                          Automatisch
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {moderationItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Geen moderatiegeschiedenis beschikbaar
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};