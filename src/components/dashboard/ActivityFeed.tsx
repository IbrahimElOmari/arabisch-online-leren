import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Trophy, BookOpen, MessageSquare } from 'lucide-react';

interface Activity {
  id: string;
  type: 'lesson_completed' | 'achievement' | 'forum_post' | 'quiz_passed';
  title: string;
  description: string;
  timestamp: string;
  points?: number;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lesson_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'forum_post':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'quiz_passed':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'lesson_completed':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'forum_post':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'quiz_passed':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Recente Activiteit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 rounded-lg border ${getActivityColor(activity.type)} transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    {activity.points && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        +{activity.points} XP
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};