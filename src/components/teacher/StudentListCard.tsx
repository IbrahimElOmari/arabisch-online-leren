import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Award, MessageSquare, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

interface StudentListCardProps {
  students: any[];
}

export default function StudentListCard({ students }: StudentListCardProps) {
  const { t } = useTranslation();

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {t('teacher.noStudentsYet')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((enrollment) => {
        const student = enrollment.profiles;
        const initials = student?.full_name
          ?.split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase() || '?';

        return (
          <Card key={enrollment.id} className="hover:bg-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <Link 
                    to={`/teacher/students/${student?.id}`}
                    className="font-semibold hover:underline"
                  >
                    {student?.full_name || t('teacher.unknownStudent')}
                  </Link>
                  <p className="text-sm text-muted-foreground">{student?.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {enrollment.payment_status === 'paid' 
                      ? t('teacher.active') 
                      : t('teacher.pending')}
                  </Badge>

                  <Link to={`/teacher/students/${student?.id}/submissions`}>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      {t('teacher.submissions')}
                    </Button>
                  </Link>

                  <Link to={`/teacher/students/${student?.id}/rewards`}>
                    <Button variant="ghost" size="sm">
                      <Award className="h-4 w-4 mr-2" />
                      {t('teacher.reward')}
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {t('teacher.sendMessage')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        {t('teacher.viewNotes')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
