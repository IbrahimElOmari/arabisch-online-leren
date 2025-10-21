import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';
import { TeacherGradingPanel } from '@/components/teacher/TeacherGradingPanel';
import { BulkGradingModal } from '@/components/teacher/BulkGradingModal';
import { GradingAnalytics } from '@/components/teacher/GradingAnalytics';
import { AutoGradingSystem } from '@/components/teacher/AutoGradingSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TeachingModal } from '@/components/teaching/TeachingModal';
import { AttendanceModal } from '@/components/teaching/AttendanceModal';
import { PerformanceModal } from '@/components/teaching/PerformanceModal';

import { TeacherAnalytics } from '@/components/teacher/TeacherAnalytics';
import { RealtimeChat } from '@/components/communication/RealtimeChat';
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  FileText,
  BarChart3,
  Clock,
  Plus,
  AlertTriangle,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Class {
  id: string;
  name: string;
  description: string | null;
}

const TeacherDashboard = () => {
  const { profile } = useAuth();
  const { 
    isRTL, 
    getFlexDirection, 
    getTextAlign, 
    getMarginStart, 
    getMarginEnd 
  } = useRTLLayout();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [teachingOpen, setTeachingOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [bulkGradingOpen, setBulkGradingOpen] = useState(false);
  const [gradingMode, setGradingMode] = useState<'individual' | 'bulk' | 'auto' | 'analytics'>('individual');

  useEffect(() => {
    if (profile?.id) {
      fetchClasses();
    }
  }, [profile?.id]);

  const fetchClasses = async () => {
    console.debug('🔄 TeacherDashboard: Starting class fetch');
    setLoading(true);
    setError(null);

    try {
      console.debug('Fetching classes for teacher:', profile?.id);

      const controller = new AbortController();
      const timer = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ TeacherDashboard: Aborting classes fetch after 4s');
        }
        controller.abort();
      }, 4000);

      if (!profile?.id) {
        setClasses([]);
        return;
      }

      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .eq('teacher_id', profile.id)
        .abortSignal(controller.signal);

      clearTimeout(timer);

      if (error) throw error;

      console.debug('Classes loaded:', data);
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      } else {
        setSelectedClass(null);
      }

      console.debug('✅ TeacherDashboard: Classes fetched successfully');
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ TeacherDashboard: Error fetching classes:', err);
      }
      setError('Laden van klassen duurde te lang of mislukte. We tonen voorlopig een lege lijst. Probeer opnieuw.');
      setClasses([]);
      setSelectedClass(null);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedClassName = () => {
    const selectedClassObj = classes.find(c => c.id === selectedClass);
    return selectedClassObj?.name || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-6 w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'لا يمكن تحميل الصفوف' : 'Kon klassen niet laden'}
              </AlertTitle>
              <AlertDescription className={`flex items-center gap-3 ${getFlexDirection()}`}>
                <span className={isRTL ? 'arabic-text' : ''}>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchClasses}>
                  {isRTL ? 'حاول مرة أخرى' : 'Opnieuw proberen'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className={`text-xl font-semibold mb-4 ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'لا توجد صفوف متاحة' : 'Geen klassen beschikbaar'}
              </h2>
              <p className={`text-muted-foreground mb-4 ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'لم نتمكن من تحميل الصفوف. حاول مرة أخرى لاحقاً أو انقر على "حاول مرة أخرى".' : 'We konden geen klassen ophalen. Probeer het later opnieuw of klik op "Opnieuw proberen".'}
              </p>
              <Button onClick={fetchClasses}>
                {isRTL ? 'حاول مرة أخرى' : 'Opnieuw proberen'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className={isRTL ? 'arabic-text' : ''}>
              {isRTL ? 'مشكلة في الاتصال' : 'Verbindingsprobleem'}
            </AlertTitle>
            <AlertDescription className={`flex items-center gap-3 ${getFlexDirection()}`}>
              <span className={isRTL ? 'arabic-text' : ''}>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchClasses}>
                {isRTL ? 'حاول مرة أخرى' : 'Opnieuw proberen'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? `أهلاً وسهلاً، ${profile?.full_name}!` : `Welkom, ${profile?.full_name}!`}
          </h1>
          <p className={`text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'هنا تجد نظرة عامة على صفوفك ومواد التدريس.' : 'Hier vind je een overzicht van je klassen en lesmateriaal.'}
          </p>
        </div>

        <div className="grid gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <Users className="h-5 w-5" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'صفوفي' : 'Mijn Klassen'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex flex-wrap gap-2 mb-4 ${getFlexDirection()}`}>
                {classes.map((klas) => (
                  <Button
                    key={klas.id}
                    variant={selectedClass === klas.id ? "default" : "outline"}
                    onClick={() => setSelectedClass(klas.id)}
                    className={`flex items-center gap-2 ${getFlexDirection()}`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className={isRTL ? 'arabic-text' : ''}>{klas.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedClass && (
          <Tabs defaultValue="tasks" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="tasks" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <FileText className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'إنشاء' : 'Maken'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="grading" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <CheckSquare className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'تقييم' : 'Beoordelen'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="teaching" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <BookOpen className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'تدريس' : 'Lesgeven'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <Calendar className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'الحضور' : 'Aanwezigheid'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="performance" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <BarChart3 className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'الأداء' : 'Prestaties'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <BarChart3 className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'التحليلات' : 'Analytics'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="chat" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <MessageSquare className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'الدردشة' : 'Chat'}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'إدارة المهام والأسئلة' : 'Beheer Taken & Vragen'}
                  </CardTitle>
                  <p className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                    {isRTL ? 'أنشئ مهام وأسئلة جديدة لطلابك' : 'Maak nieuwe taken en vragen voor je studenten'}
                  </p>
                </CardHeader>
                <CardContent>
                  <TaskQuestionManagementNew />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grading" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'التقييم والملاحظات' : 'Beoordeling & Feedback'}
                  </CardTitle>
                  <p className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                    {isRTL ? 'اعرض وقيّم تقديمات طلابك' : 'Bekijk en beoordeel inzendingen van je studenten'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Grading Mode Selector */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={gradingMode === 'individual' ? 'default' : 'outline'}
                        onClick={() => setGradingMode('individual')}
                        size="sm"
                      >
                        <span className={isRTL ? 'arabic-text' : ''}>
                          {isRTL ? 'فردي' : 'Individueel'}
                        </span>
                      </Button>
                      <Button
                        variant={gradingMode === 'bulk' ? 'default' : 'outline'}
                        onClick={() => setGradingMode('bulk')}
                        size="sm"
                      >
                        <span className={isRTL ? 'arabic-text' : ''}>
                          {isRTL ? 'مجمع' : 'Bulksgewijs'}
                        </span>
                      </Button>
                      <Button
                        variant={gradingMode === 'auto' ? 'default' : 'outline'}
                        onClick={() => setGradingMode('auto')}
                        size="sm"
                      >
                        <span className={isRTL ? 'arabic-text' : ''}>
                          {isRTL ? 'تلقائي' : 'Automatisch'}
                        </span>
                      </Button>
                      <Button
                        variant={gradingMode === 'analytics' ? 'default' : 'outline'}
                        onClick={() => setGradingMode('analytics')}
                        size="sm"
                      >
                        <span className={isRTL ? 'arabic-text' : ''}>
                          {isRTL ? 'إحصائيات' : 'Analytics'}
                        </span>
                      </Button>
                    </div>

                    {/* Render based on selected mode */}
                    {gradingMode === 'individual' && (
                      <TeacherGradingPanel classId={selectedClass} />
                    )}
                    
                    {gradingMode === 'bulk' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                            {isRTL ? 'قيّم عدة تسليمات بنفس الدرجة والتعليقات.' : 'Beoordeel meerdere inzendingen tegelijk met hetzelfde cijfer en feedback.'}
                          </p>
                          <Button onClick={() => setBulkGradingOpen(true)}>
                            <span className={isRTL ? 'arabic-text' : ''}>
                              {isRTL ? 'فتح التقييم المجمع' : 'Open Bulk Beoordeling'}
                            </span>
                          </Button>
                        </div>
                        <TeacherGradingPanel classId={selectedClass} />
                      </div>
                    )}
                    
                    {gradingMode === 'auto' && (
                      <AutoGradingSystem classId={selectedClass} />
                    )}
                    
                    {gradingMode === 'analytics' && (
                      <GradingAnalytics classId={selectedClass} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teaching" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'التدريس' : 'Lesgeven'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className={`mb-4 flex items-center gap-2 ${getFlexDirection()}`}
                    onClick={() => setTeachingOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className={isRTL ? 'arabic-text' : ''}>
                      {isRTL ? 'درس جديد' : 'Nieuwe les'}
                    </span>
                  </Button>
                  <TeachingModal 
                    open={teachingOpen} 
                    onOpenChange={setTeachingOpen}
                    selectedClass={selectedClass}
                    type="youtube"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'الحضور' : 'Aanwezigheid'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => setAttendanceOpen(true)}
                  >
                    <span className={isRTL ? 'arabic-text' : ''}>
                      {isRTL ? 'تسجيل الحضور' : 'Aanwezigheid registreren'}
                    </span>
                  </Button>
                  <AttendanceModal 
                    open={attendanceOpen} 
                    onOpenChange={setAttendanceOpen}
                    classId={selectedClass}
                    className={getSelectedClassName()}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'الأداء' : 'Prestaties'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => setPerformanceOpen(true)}
                  >
                    <span className={isRTL ? 'arabic-text' : ''}>
                      {isRTL ? 'عرض الأداء' : 'Prestaties bekijken'}
                    </span>
                  </Button>
                  <PerformanceModal 
                    open={performanceOpen} 
                    onOpenChange={setPerformanceOpen}
                    classId={selectedClass}
                    className={getSelectedClassName()}
                  />
                 </CardContent>
               </Card>
             </TabsContent>

             <TabsContent value="analytics" className="mt-6">
               <TeacherAnalytics 
                 classId={selectedClass || ''}
                 teacherId={profile?.id || ''}
               />
             </TabsContent>

             <TabsContent value="chat" className="mt-6">
               <RealtimeChat 
                 roomId={`teacher-${selectedClass}`}
                 roomType="class"
               />
             </TabsContent>
           </Tabs>
        )}
      </div>
      <BulkGradingModal
        isOpen={bulkGradingOpen}
        onClose={() => setBulkGradingOpen(false)}
        classId={selectedClass || ''}
      />
    </div>
  );
};

export default TeacherDashboard;
