import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, CheckCircle } from 'lucide-react';
import { StudentProgress } from '@/hooks/useStudentProgress';

interface Achievement {
  id: string;
  type: 'level_completed' | 'points_milestone' | 'tasks_completed' | 'questions_answered';
  title: string;
  description: string;
  points: number;
  date: Date;
  icon: React.ReactNode;
}

interface RecentAchievementsProps {
  progressData: StudentProgress[];
}

export const RecentAchievements: React.FC<RecentAchievementsProps> = ({ progressData }) => {
  // Generate achievements from progress data
  const generateAchievements = (data: StudentProgress[]): Achievement[] => {
    const achievements: Achievement[] = [];
    
    data.forEach((progress) => {
      // Level completion achievements
      if (progress.is_completed && progress.completed_at) {
        achievements.push({
          id: `level_${progress.id}`,
          type: 'level_completed',
          title: 'Level Voltooid!',
          description: `${progress.niveau?.naam || `Level ${progress.niveau?.niveau_nummer}`} succesvol afgerond`,
          points: 1000,
          date: new Date(progress.completed_at),
          icon: <Trophy className="h-4 w-4 text-yellow-500" />
        });
      }
      
      // Points milestones
      const milestones = [250, 500, 750];
      milestones.forEach((milestone) => {
        if (progress.total_points >= milestone && !progress.is_completed) {
          achievements.push({
            id: `points_${progress.id}_${milestone}`,
            type: 'points_milestone',
            title: `${milestone} Punten Bereikt!`,
            description: `${milestone} punten behaald in ${progress.niveau?.naam}`,
            points: milestone,
            date: new Date(progress.updated_at),
            icon: <Star className="h-4 w-4 text-blue-500" />
          });
        }
      });
      
      // Task completion achievements
      if (progress.completed_tasks >= 5) {
        achievements.push({
          id: `tasks_${progress.id}`,
          type: 'tasks_completed',
          title: 'Taak Meester!',
          description: `${progress.completed_tasks} taken voltooid`,
          points: progress.completed_tasks * 10,
          date: new Date(progress.updated_at),
          icon: <Target className="h-4 w-4 text-green-500" />
        });
      }
      
      // Question answering achievements
      if (progress.completed_questions >= 10) {
        achievements.push({
          id: `questions_${progress.id}`,
          type: 'questions_answered',
          title: 'Vraag Expert!',
          description: `${progress.completed_questions} vragen beantwoord`,
          points: progress.completed_questions * 5,
          date: new Date(progress.updated_at),
          icon: <CheckCircle className="h-4 w-4 text-purple-500" />
        });
      }
    });
    
    // Sort by date (newest first) and take recent ones
    return achievements
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  };

  const achievements = generateAchievements(progressData);

  if (achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Recente Prestaties
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Begin met leren om je eerste prestaties te behalen!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Recente Prestaties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border"
          >
            <div className="flex-shrink-0">
              {achievement.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">
                  {achievement.title}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  +{achievement.points}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {achievement.description}
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground flex-shrink-0">
              {achievement.date.toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </div>
          </div>
        ))}
        
        {achievements.length === 6 && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              En nog veel meer prestaties...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};