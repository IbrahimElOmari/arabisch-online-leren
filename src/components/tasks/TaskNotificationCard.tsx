import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description?: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  author?: {
    full_name: string;
  };
  level_name?: string;
  class_name?: string;
}

interface TaskNotificationCardProps {
  task: Task;
  onNavigateToTask: (taskId: string) => void;
}

export const TaskNotificationCard: React.FC<TaskNotificationCardProps> = ({ 
  task, 
  onNavigateToTask 
}) => {
  return (
    <Card className="animate-fade-in border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {task.required_submission_type === 'file' ? (
              <Upload className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            <div>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {task.class_name} - {task.level_name}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Nieuw
            </Badge>
            <Badge variant="outline">
              Max: {task.grading_scale}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Door {task.author?.full_name} • {new Date(task.created_at).toLocaleDateString('nl-NL')}
          </div>
          
          <Button 
            onClick={() => onNavigateToTask(task.id)}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Bekijk Taak
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};