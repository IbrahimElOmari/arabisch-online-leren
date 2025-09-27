
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Users, CheckCircle, Clock, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentPerformance {
  id: string;
  full_name: string;
  attendanceCount: number;
  totalLessons: number;
  recentTasks: Array<{
    id: string;
    title: string;
    grade: number | null;
    submitted_at: string;
  }>;
}

interface PerformanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  levelId?: string;
}

export function PerformanceModal({ open, onOpenChange, classId, className, levelId }: PerformanceModalProps) {
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && classId) {
      fetchPerformanceData();
    }
  }, [open, classId]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      console.log('Fetching performance data for class:', classId);
      
      // Get enrolled students with better error handling
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('inschrijvingen')
        .select(`
          student_id,
          profiles:student_id (
            id,
            full_name
          )
        `)
        .eq('class_id', classId)
        .eq('payment_status', 'paid');

      if (enrollmentError) {
        console.error('Enrollment fetch error:', enrollmentError);
        throw enrollmentError;
      }

      console.log('Raw enrollments data:', enrollments);

      // Filter out invalid enrollments and add null checks
      const validEnrollments = (enrollments || []).filter(enrollment => {
        const hasValidProfile = enrollment.profiles && 
                               enrollment.profiles.id && 
                               enrollment.profiles.full_name;
        
        if (!hasValidProfile) {
          console.warn('Invalid enrollment found:', enrollment);
        }
        
        return hasValidProfile;
      });

      console.log('Valid enrollments after filtering:', validEnrollments.length);

      // Get attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('aanwezigheid')
        .select(`
          student_id,
          status,
          lessen:lesson_id (
            class_id
          )
        `)
        .eq('lessen.class_id', classId);

      if (attendanceError) {
        console.error('Attendance fetch error:', attendanceError);
        throw attendanceError;
      }

      // Get total lessons for this class
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessen')
        .select('id')
        .eq('class_id', classId);

      if (lessonsError) {
        console.error('Lessons fetch error:', lessonsError);
        throw lessonsError;
      }

      const totalLessons = lessons?.length || 0;

      // Get task submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('task_submissions')
        .select(`
          student_id,
          grade,
          submitted_at,
          tasks:task_id (
            title,
            level_id,
            niveaus:level_id (
              class_id
            )
          )
        `)
        .eq('tasks.niveaus.class_id', classId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Submissions fetch error:', submissionsError);
        throw submissionsError;
      }

      // Process data for each student with comprehensive null checking
      const performanceData: StudentPerformance[] = validEnrollments.map(enrollment => {
        // Double-check profile exists (should be guaranteed by filter above)
        if (!enrollment.profiles) {
          console.error('Unexpected null profile in valid enrollments:', enrollment);
          return null;
        }

        const studentId = enrollment.profiles.id;
        const studentName = enrollment.profiles.full_name || 'Onbekende naam';
        
        // Count attendance with null checks
        const studentAttendance = (attendanceData || []).filter(
          att => att && att.student_id === studentId && att.status === 'aanwezig'
        );
        
        // Get recent tasks (last 3) with null checks
        const studentTasks = (submissions || []).filter(
          sub => sub && sub.student_id === studentId
        ).slice(0, 3);

        const recentTasks = studentTasks.map(task => ({
          id: task.tasks?.title || `task-${Math.random()}`,
          title: task.tasks?.title || 'Onbekende taak',
          grade: task.grade,
          submitted_at: task.submitted_at
        }));

        return {
          id: studentId,
          full_name: studentName,
          attendanceCount: studentAttendance.length,
          totalLessons,
          recentTasks
        };
      }).filter(Boolean) as StudentPerformance[]; // Remove any null entries

      console.log('Final performance data:', performanceData);
      setStudents(performanceData);
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Fout",
        description: "Kon prestatie gegevens niet laden",
        variant: "destructive"
      });
      setStudents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getAttendancePercentage = (attendanceCount: number, totalLessons: number) => {
    if (totalLessons === 0) return 0;
    return Math.round((attendanceCount / totalLessons) * 100);
  };

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-600">Uitstekend</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-600">Gemiddeld</Badge>;
    return <Badge variant="destructive">Zorgelijk</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Prestaties Overzicht - {className}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Laden...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen prestatie gegevens beschikbaar
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ms-4">
                        <p className="text-sm font-medium text-muted-foreground">Totaal Leerlingen</p>
                        <p className="text-2xl font-bold">{students.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ms-4">
                        <p className="text-sm font-medium text-muted-foreground">Gemiddelde Aanwezigheid</p>
                        <p className="text-2xl font-bold">
                          {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + getAttendancePercentage(s.attendanceCount, s.totalLessons), 0) / students.length) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-purple-600" />
                      <div className="ms-4">
                        <p className="text-sm font-medium text-muted-foreground">Totaal Lessen</p>
                        <p className="text-2xl font-bold">{students[0]?.totalLessons || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {students.map((student) => {
                  const attendancePercentage = getAttendancePercentage(student.attendanceCount, student.totalLessons);
                  
                  return (
                    <Card key={student.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{student.full_name}</CardTitle>
                          {getAttendanceBadge(attendancePercentage)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Aanwezigheid
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{student.attendanceCount} van {student.totalLessons} lessen</span>
                                <span>{attendancePercentage}%</span>
                              </div>
                              <Progress value={attendancePercentage} className="h-2" />
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Recente Taken ({student.recentTasks.length})
                            </h4>
                            <div className="space-y-2">
                              {student.recentTasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Geen taken ingediend</p>
                              ) : (
                                student.recentTasks.map((task, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="truncate">{task.title}</span>
                                    <div className="flex items-center gap-2">
                                      {task.grade !== null ? (
                                        <Badge variant={task.grade >= 7 ? "default" : task.grade >= 5.5 ? "secondary" : "destructive"}>
                                          {task.grade}/10
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline">Nog niet beoordeeld</Badge>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
