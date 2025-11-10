import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useGamification } from '@/hooks/useGamification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XPBar } from '@/components/gamification/XPBar';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { BadgeDisplay } from '@/components/gamification/BadgeDisplay';
import { Leaderboard } from '@/components/gamification/LeaderboardWrapper';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { Trophy, Target, Award, TrendingUp } from 'lucide-react';

export default function Gamification() {
  const { user } = useAuth();
  const { 
    profile, 
    profileLoading, 
    challenges, 
    studentChallenges,
    completeChallenge 
  } = useGamification(user?.id || '');

  useEffect(() => {
    document.title = 'Gamificatie - EdTech Platform';
  }, []);

  if (profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Welkom bij Gamificatie!</h2>
            <p className="text-muted-foreground mb-6">
              Voltooi je eerste taak om je gamificatie-profiel te activeren en XP te beginnen verdienen!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameMode = profile.game_mode as 'SPEELS' | 'PRESTIGE';
  const completedChallengeIds = new Set(
    studentChallenges
      .filter(sc => sc.is_completed)
      .map(sc => sc.challenge_id)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {gameMode === 'SPEELS' ? '🎮 Jouw Avontuur' : '🏆 Jouw Voortgang'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {gameMode === 'SPEELS' 
              ? 'Verdien XP, voltooi uitdagingen en verzamel badges!' 
              : 'Bereik expertise door consistente prestaties'}
          </p>
        </div>
      </div>

      {/* XP Bar */}
      <XPBar 
        currentXP={profile.xp_points} 
        level={profile.level} 
        gameMode={gameMode}
      />

      {/* Streak Display */}
      <StreakDisplay 
        streakDays={profile.streak_days} 
        gameMode={gameMode}
      />

      {/* Main Content */}
      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges">
            <Target className="h-4 w-4 mr-2" />
            Uitdagingen
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Award className="h-4 w-4 mr-2" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Klassement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Actieve Uitdagingen</CardTitle>
              <CardDescription>
                Voltooi uitdagingen om extra XP te verdienen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {challenges.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Geen actieve uitdagingen op dit moment
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {challenges.map((challenge: any) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      isCompleted={completedChallengeIds.has(challenge.id)}
                      onComplete={completeChallenge}
                      gameMode={gameMode}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Behaalde Badges</CardTitle>
              <CardDescription>
                Badges die je hebt verdiend tijdens je leertraject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BadgeDisplay 
                badges={[]}
                gameMode={gameMode}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4 mt-6">
          <Leaderboard 
            leaderboardType="global" 
            period="all_time"
            gameMode={gameMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
