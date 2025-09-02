
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
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions = ({ onAction }: QuickActionsProps) => {
  const { getTextAlign, getFlexDirection, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  const actions = [
    {
      id: 'continue-learning',
      title: t('actions.continue_learning'),
      description: t('actions.continue_learning_desc'),
      icon: PlayCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      primary: true
    },
    {
      id: 'watch-video',
      title: t('actions.watch_video'),
      description: t('actions.watch_video_desc'),
      icon: Video,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'forum',
      title: t('actions.forum'),
      description: t('actions.forum_desc'),
      icon: MessageSquare,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'schedule',
      title: t('actions.schedule'),
      description: t('actions.schedule_desc'),
      icon: Calendar,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'assignments',
      title: t('actions.assignments'),
      description: t('actions.assignments_desc'),
      icon: FileText,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'library',
      title: t('actions.library'),
      description: t('actions.library_desc'),
      icon: BookOpen,
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
          {t('actions.quick_actions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isRTL ? 'rtl-grid' : ''}`}>
          {actions.map(({ id, title, description, icon: Icon, color, primary }) => (
            <Button
              key={id}
              variant={primary ? "default" : "outline"}
              className={`h-auto p-4 ${getFlexDirection('col')} items-center gap-2 ${getTextAlign('center')} ${
                primary ? '' : 'hover:bg-muted'
              }`}
              onClick={() => onAction(id)}
            >
              <div className={`p-2 rounded-lg ${primary ? 'bg-white/20' : 'bg-muted'}`}>
                <Icon className={`h-5 w-5 ${primary ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div className={getTextAlign('center')}>
                <p className={`font-medium text-sm ${primary ? 'text-white' : 'text-foreground'} ${isRTL ? 'arabic-text' : ''}`}>
                  {title}
                </p>
                <p className={`text-xs ${primary ? 'text-white/80' : 'text-muted-foreground'} ${isRTL ? 'arabic-text' : ''}`}>
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
