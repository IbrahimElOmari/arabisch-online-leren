import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Play,
  Trash2, 
  Calendar,
  User,
  ExternalLink 
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PastLesson {
  id: string;
  title: string;
  youtube_url: string | null;
  class_id: string;
  created_at: string;
  klassen?: {
    name: string;
  } | null;
}

interface PastLessonsManagerProps {
  classId: string;
  niveauId?: string;
}

const PastLessonsManager = ({ classId, niveauId }: PastLessonsManagerProps) => {
  const { isAdmin, isTeacher } = useUserRole();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<PastLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastLessons();
  }, [classId, niveauId]);

  const fetchPastLessons = async () => {
    try {
      setLoading(true);
      
      // Eenvoudige query voor lessen met YouTube URLs
      const { data, error } = await supabase
        .from('lessen')
        .select(`
          id,
          title,
          youtube_url,
          class_id,
          created_at,
          klassen:class_id (
            name
          )
        `)
        .eq('class_id', classId)
        .not('youtube_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLessons((data as any) || []);
    } catch (error) {
      console.error('Error fetching past lessons:', error);
      toast({
        title: "Fout",
        description: "Kon voorbije lessen niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm('Weet je zeker dat je deze les wilt verwijderen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessen')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Les succesvol verwijderd"
      });

      fetchPastLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Fout",
        description: "Kon les niet verwijderen",
        variant: "destructive"
      });
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const canManageLesson = () => {
    return isAdmin || isTeacher;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Voorbije Lessen
          <Badge variant="outline" className="ms-auto">
            {lessons.length} video{lessons.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <EmptyState
            icon={Play}
            title="Geen voorbije lessen"
            description="Er zijn nog geen YouTube video's geüpload voor deze klas."
          />
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const videoId = lesson.youtube_url ? getYouTubeVideoId(lesson.youtube_url) : null;
              
              return (
                <div key={lesson.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Video thumbnail */}
                    {videoId && (
                      <div className="flex-shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                          alt={lesson.title}
                          className="w-24 h-16 rounded object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Video details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-lg">{lesson.title}</h4>
                        <div className="flex items-center gap-2">
                          {lesson.youtube_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(lesson.youtube_url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 me-1" />
                              Bekijken
                            </Button>
                          )}
                          {canManageLesson() && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4 me-1" />
                              Verwijderen
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(lesson.created_at).toLocaleDateString('nl-NL')}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {lesson.klassen?.name || 'Onbekende klas'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PastLessonsManager;
