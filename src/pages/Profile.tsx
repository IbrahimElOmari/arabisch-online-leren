import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award,
  BookOpen,
  MessageCircle,
  CheckCircle,
  Flame
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { ThemeSelector } from '@/components/profile/ThemeSelector';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { user, profile } = useAuth();
  const { role } = useUserRole();
  const { progress: progressData } = useStudentProgress(user?.id);
  const { themeAge } = useAgeTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate statistics
  const totalPoints = progressData.reduce((sum, p) => sum + p.total_points, 0);
  const completedLevels = progressData.filter(p => p.is_completed).length;
  const totalTasks = progressData.reduce((sum, p) => sum + p.completed_tasks, 0);
  const totalQuestions = progressData.reduce((sum, p) => sum + p.completed_questions, 0);

  // Mock badges system
  const availableBadges = [
    { id: 'first_level', name: 'Eerste Level', description: 'Voltooi je eerste level', icon: '🎯', earned: completedLevels >= 1 },
    { id: 'points_master', name: 'Punten Meester', description: '1000+ punten behaald', icon: '⭐', earned: totalPoints >= 1000 },
    { id: 'task_champion', name: 'Taak Kampioen', description: '50+ taken voltooid', icon: '🏆', earned: totalTasks >= 50 },
    { id: 'question_expert', name: 'Vraag Expert', description: '100+ vragen beantwoord', icon: '🤓', earned: totalQuestions >= 100 },
    { id: 'streak_master', name: 'Streak Meester', description: '7 dagen achtereen actief', icon: '🔥', earned: false },
    { id: 'perfectionist', name: 'Perfectionist', description: '95%+ nauwkeurigheid', icon: '💎', earned: false },
  ];

  const earnedBadges = availableBadges.filter(b => b.earned);
  const unearnedBadges = availableBadges.filter(b => !b.earned);

  // Mock study timeline
  const studyHistory = [
    { date: '2024-01-15', activity: 'Level 1 voltooid', type: 'achievement', points: 1000 },
    { date: '2024-01-14', activity: '5 taken ingeleverd', type: 'task', points: 250 },
    { date: '2024-01-13', activity: '10 vragen beantwoord', type: 'question', points: 100 },
    { date: '2024-01-12', activity: 'Begonnen met Level 1', type: 'start', points: 0 },
  ];

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'space-y-6 animate-fade-in';
      case 'professional':
        return 'space-y-4';
      default:
        return 'space-y-6';
    }
  };

  const getCardClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'border-2 hover:shadow-lg transition-all duration-300';
      case 'professional':
        return 'border subtle-hover';
      default:
        return 'hover:shadow-md transition-shadow';
    }
  };

  return (
    <div className={cn("min-h-screen bg-background p-6", getThemeClasses())}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className={getCardClasses()}>
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className={cn(
                  "font-bold mb-2",
                  themeAge === 'playful' ? 'text-3xl' : 'text-2xl'
                )}>
                  {profile?.full_name || 'Gebruiker'}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <Badge variant="secondary" className="gap-2">
                    <User className="h-4 w-4" />
                    {role === 'leerling' ? 'Leerling' : role}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {totalPoints} punten
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {earnedBadges.length} badges
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className={cn(
                  "font-bold text-primary",
                  themeAge === 'playful' ? 'text-4xl' : 'text-3xl'
                )}>
                  {completedLevels}
                </div>
                <div className="text-sm text-muted-foreground">
                  Levels voltooid
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('profile.overview', 'Overzicht')}</TabsTrigger>
            <TabsTrigger value="badges">{t('profile.badges', 'Badges')}</TabsTrigger>
            <TabsTrigger value="statistics">Statistieken</TabsTrigger>
            <TabsTrigger value="history">Geschiedenis</TabsTrigger>
            <TabsTrigger value="settings">{t('profile.settings', 'Instellingen')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Quick Stats */}
              <Card className={getCardClasses()}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Snelle Statistieken
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Totale Punten</span>
                    <span className="font-semibold">{totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taken Voltooid</span>
                    <span className="font-semibold">{totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vragen Beantwoord</span>
                    <span className="font-semibold">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Badges Verdiend</span>
                    <span className="font-semibold">{earnedBadges.length}/{availableBadges.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Current Progress */}
              <Card className={getCardClasses()}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Huidige Voortgang
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressData.length > 0 ? (
                    <div className="space-y-4">
                      {progressData.slice(0, 3).map((progress) => (
                        <div key={progress.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{progress.niveau?.naam}</span>
                            <span>{progress.total_points}/1000</span>
                          </div>
                          <Progress value={Math.min((progress.total_points / 1000) * 100, 100)} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nog geen voortgang om te tonen
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Badges */}
              <Card className={getCardClasses()}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Recente Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnedBadges.slice(0, 3).map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {badge.description}
                          </div>
                        </div>
                      </div>
                    ))}
                    {earnedBadges.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Nog geen badges verdiend
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Earned Badges */}
              <Card className={getCardClasses()}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-success" />
                    Verdiende Badges ({earnedBadges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {earnedBadges.map((badge) => (
                      <div key={badge.id} 
                           className={cn(
                             "p-4 rounded-lg border-2 border-success/20 bg-success/5",
                             themeAge === 'playful' && "celebration-effect"
                           )}>
                        <div className="text-center">
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <div className="font-semibold">{badge.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {badge.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Available Badges */}
              <Card className={getCardClasses()}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    Beschikbare Badges ({unearnedBadges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {unearnedBadges.map((badge) => (
                      <div key={badge.id} 
                           className="p-4 rounded-lg border border-border bg-muted/20">
                        <div className="text-center opacity-60">
                          <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                          <div className="font-semibold">{badge.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {badge.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Learning Stats */}
              <Card className={getCardClasses()}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Leerstatistieken
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Gemiddeld per Level</span>
                    <span className="font-semibold">
                      {progressData.length > 0 ? Math.round(totalPoints / Math.max(progressData.length, 1)) : 0} punten
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Succespercentage</span>
                    <span className="font-semibold">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gemiddelde Score</span>
                    <span className="font-semibold">8.5/10</span>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Stats */}
              <Card className={getCardClasses()}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Activiteit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Studietijd (geschat)</span>
                    <span className="font-semibold">24 uur</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Huidige Streak</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      3 dagen
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Langste Streak</span>
                    <span className="font-semibold">7 dagen</span>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Chart */}
              <Card className={getCardClasses()}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Voortgang Overzicht
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Totale Voortgang</span>
                        <span>{Math.round((completedLevels / Math.max(progressData.length, 1)) * 100)}%</span>
                      </div>
                      <Progress value={(completedLevels / Math.max(progressData.length, 1)) * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Badges Voortgang</span>
                        <span>{Math.round((earnedBadges.length / availableBadges.length) * 100)}%</span>
                      </div>
                      <Progress value={(earnedBadges.length / availableBadges.length) * 100} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className={getCardClasses()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Leergeschiedenis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studyHistory.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className={cn(
                        "p-2 rounded-full",
                        entry.type === 'achievement' && "bg-success/20 text-success",
                        entry.type === 'task' && "bg-primary/20 text-primary",
                        entry.type === 'question' && "bg-blue-500/20 text-blue-500",
                        entry.type === 'start' && "bg-muted text-muted-foreground"
                      )}>
                        {entry.type === 'achievement' && <Trophy className="h-4 w-4" />}
                        {entry.type === 'task' && <CheckCircle className="h-4 w-4" />}
                        {entry.type === 'question' && <MessageCircle className="h-4 w-4" />}
                        {entry.type === 'start' && <BookOpen className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{entry.activity}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                      {entry.points > 0 && (
                        <Badge variant="secondary">
                          +{entry.points} punten
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <ThemeSelector />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;