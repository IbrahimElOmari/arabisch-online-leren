
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LogOut, 
  BookOpen, 
  Trophy, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Users,
  Star,
  Clock,
  Target,
  Award,
  Flame,
  User
} from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';
import { WelcomeWidget } from './WelcomeWidget';
import { BadgeSystem, UserBadge, UserLevel } from '@/components/gamification/BadgeSystem';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { LeaderboardSystem } from '@/components/gamification/LeaderboardSystem';
import { MentorSystem } from '@/components/community/MentorSystem';
import { RealtimeChat } from '@/components/community/RealtimeChat';
import { CourseRecommendations } from '@/components/ai/CourseRecommendations';
import { ActivityFeed } from './ActivityFeed';

const StudentDashboard = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const mockBadges: UserBadge[] = [
    {
      id: '1',
      name: 'Eerste Les',
      description: 'Voltooi je eerste Arabische les',
      icon: 'star',
      earned: true,
      earnedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Weekstreak',
      description: '7 dagen achter elkaar geoefend',
      icon: 'trophy',
      earned: true,
      earnedAt: '2024-01-22'
    },
    {
      id: '3',
      name: 'Spraakmeester',
      description: 'Voltooi 50 uitspraakoefeningen',
      icon: 'target',
      earned: false,
      progress: 23,
      maxProgress: 50
    }
  ];

  const mockUserLevel: UserLevel = {
    currentLevel: 3,
    currentXP: 1250,
    nextLevelXP: 1500,
    totalXP: 3750
  };

  const mockStreakData = {
    currentStreak: 12,
    longestStreak: 18,
    lastActivity: '2024-01-20T10:30:00',
    todayCompleted: true,
    weeklyGoal: 5,
    weeklyProgress: 3
  };

  const mockLeaderboardUsers = [
    {
      id: '1',
      name: 'Ahmed Al-Rashid',
      points: 2500,
      rank: 1,
      streak: 25,
      coursesCompleted: 3,
      level: 4
    },
    {
      id: '2',
      name: 'Fatima Hassan',
      points: 2200,
      rank: 2,
      streak: 15,
      coursesCompleted: 2,
      level: 3
    },
    {
      id: 'current',
      name: profile?.full_name || 'Jij',
      points: 1250,
      rank: 8,
      streak: 12,
      coursesCompleted: 1,
      level: 3
    }
  ];

  const mockMentors = [
    {
      id: '1',
      name: 'Dr. Amira Khalil',
      expertise: ['Grammatica', 'Conversatie', 'Klassiek Arabisch'],
      rating: 4.9,
      totalSessions: 150,
      languages: ['Arabisch', 'Nederlands', 'Engels'],
      availability: [
        { day: 'Maandag', time: '14:00', available: true },
        { day: 'Woensdag', time: '16:00', available: true },
        { day: 'Vrijdag', time: '10:00', available: true }
      ]
    }
  ];

  const mockChatChannels = [
    {
      id: 'general',
      name: 'algemeen',
      description: 'Algemene discussies over Arabisch leren',
      memberCount: 45,
      isActive: true
    },
    {
      id: 'beginner',
      name: 'beginners',
      description: 'Voor nieuwe leerlingen',
      memberCount: 23,
      isActive: false
    }
  ];

  const mockChatMessages = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Ahmed',
      content: 'Heeft iemand tips voor het onthouden van werkwoorden?',
      timestamp: new Date(Date.now() - 300000),
      type: 'message' as const
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Fatima',
      content: 'Ik gebruik flashcards, werkt heel goed!',
      timestamp: new Date(Date.now() - 240000),
      type: 'message' as const
    }
  ];

  const mockRecommendations = [
    {
      id: 'course-1',
      title: 'Arabische Grammatica Diepduik',
      description: 'Versterk je grammaticakennis met praktische oefeningen',
      instructor: 'Dr. Omar Mansour',
      duration: '6 weken',
      level: 'intermediate' as const,
      rating: 4.8,
      enrollments: 234,
      matchScore: 92,
      reasons: [
        'Past bij je huidige niveau',
        'Helpt met geïdentificeerde zwakke punten',
        'Hoge waardering van andere leerlingen'
      ],
      price: 89
    }
  ];

  const mockActivities = [
    {
      id: '1',
      type: 'lesson_completed' as const,
      title: 'Les 5 voltooid',
      description: 'Arabische werkwoorden - verleden tijd',
      timestamp: '2 uur geleden',
      points: 50
    },
    {
      id: '2',
      type: 'achievement' as const,
      title: 'Badge behaald',
      description: 'Weekstreak - 7 dagen achter elkaar geoefend',
      timestamp: '1 dag geleden',
      points: 100
    }
  ];

  const mockUserProgress = {
    completedCourses: 1,
    currentLevel: 'Niveau 3',
    interests: ['Grammatica', 'Conversatie', 'Cultuur'],
    weakAreas: ['Werkwoorden', 'Luistervaardigheden']
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mijn Leeromgeving</h1>
            <p className="text-muted-foreground">Welkom terug, {profile?.full_name}</p>
          </div>
          <Button onClick={signOut} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <WelcomeWidget recentActivity="Je hebt vandaag 2 lessen voltooid!" />

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Leren
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Voortgang
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="mentors" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Mentoren
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Aanbevelingen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StreakCounter streakData={mockStreakData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityFeed activities={mockActivities} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recente Cursussen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Arabisch voor Beginners</h4>
                          <p className="text-sm text-muted-foreground">Les 5 van 12</p>
                        </div>
                      </div>
                      <Progress value={42} className="w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Huidige Les</h3>
                      <p className="text-sm text-muted-foreground">Werkwoorden - Verleden Tijd</p>
                    </div>
                  </div>
                  <Button className="w-full">
                    Verder Leren
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">Oefenopdrachten</h3>
                      <p className="text-sm text-muted-foreground">3 nieuwe opdrachten</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Bekijk Opdrachten
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold">Live Lessen</h3>
                      <p className="text-sm text-muted-foreground">Volgende les: Morgen 19:00</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Bekijk Schema
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <BadgeSystem 
              badges={mockBadges} 
              userLevel={mockUserLevel}
              showProgress={true}
            />
            
            <LeaderboardSystem 
              users={mockLeaderboardUsers}
              currentUserId="current"
              timeframe="week"
            />
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <RealtimeChat
              channels={mockChatChannels}
              currentChannel="general"
              messages={mockChatMessages}
              currentUser={{
                id: 'current',
                name: profile?.full_name || 'Jij'
              }}
              onSendMessage={(content, channelId) => {
                console.log('Send message:', content, 'to channel:', channelId);
              }}
              onJoinChannel={(channelId) => {
                console.log('Join channel:', channelId);
              }}
            />
          </TabsContent>

          <TabsContent value="mentors" className="space-y-6">
            <MentorSystem
              mentors={mockMentors}
              onBookSession={(mentorId, timeSlot) => {
                console.log('Book session with mentor:', mentorId, 'at:', timeSlot);
              }}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <CourseRecommendations
              recommendations={mockRecommendations}
              userProgress={mockUserProgress}
              onEnrollCourse={(courseId) => {
                console.log('Enroll in course:', courseId);
                navigate(`/course/${courseId}`);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
