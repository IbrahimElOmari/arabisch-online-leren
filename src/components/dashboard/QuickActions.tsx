
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Video, 
  MessageSquare, 
  Calendar, 
  FileText,
  PlayCircle 
} from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions = ({ onAction }: QuickActionsProps) => {
  const actions = [
    {
      id: 'continue-learning',
      title: 'Verder Leren',
      description: 'Ga verder waar je gebleven was',
      icon: PlayCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      primary: true
    },
    {
      id: 'watch-video',
      title: 'Video Bekijken',
      description: 'Bekijk de laatste les',
      icon: Video,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'forum',
      title: 'Forum',
      description: 'Stel een vraag',
      icon: MessageSquare,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'schedule',
      title: 'Planning',
      description: 'Bekijk je planning',
      icon: Calendar,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'assignments',
      title: 'Opdrachten',
      description: 'Bekijk openstaande taken',
      icon: FileText,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'library',
      title: 'Bibliotheek',
      description: 'Bekijk alle materialen',
      icon: BookOpen,
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snelle Acties</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map(({ id, title, description, icon: Icon, color, primary }) => (
            <Button
              key={id}
              variant={primary ? "default" : "outline"}
              className={`h-auto p-4 flex flex-col items-center gap-2 text-center ${
                primary ? '' : 'hover:bg-muted'
              }`}
              onClick={() => onAction(id)}
            >
              <div className={`p-2 rounded-lg ${primary ? 'bg-white/20' : 'bg-muted'}`}>
                <Icon className={`h-5 w-5 ${primary ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`font-medium text-sm ${primary ? 'text-white' : 'text-foreground'}`}>
                  {title}
                </p>
                <p className={`text-xs ${primary ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
