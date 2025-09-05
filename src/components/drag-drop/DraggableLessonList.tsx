import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Video, FileText, Clock, Edit, Trash2 } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface DragItem {
  id: string;
  title: string;
  type: 'video' | 'task' | 'question';
  duration?: string;
  description?: string;
  order: number;
  isCompleted?: boolean;
}

interface DraggableLessonListProps {
  items: DragItem[];
  onReorder: (items: DragItem[]) => void;
  onEdit?: (item: DragItem) => void;
  onDelete?: (item: DragItem) => void;
  className?: string;
  readOnly?: boolean;
}

export const DraggableLessonList = ({
  items,
  onReorder,
  onEdit,
  onDelete,
  className = "",
  readOnly = false
}: DraggableLessonListProps) => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', item.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    if (draggedIndex === -1) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);
    
    // Update order values
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    onReorder(updatedItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [items, draggedItem, onReorder]);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'task': return <FileText className="h-4 w-4" />;
      case 'question': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getItemTypeLabel = (type: string) => {
    const labels = {
      video: isRTL ? 'فيديو' : 'Video',
      task: isRTL ? 'مهمة' : 'Taak', 
      question: isRTL ? 'سؤال' : 'Vraag'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <Card
          key={item.id}
          className={`
            ${draggedItem === item.id ? 'opacity-50' : ''}
            ${dragOverIndex === index ? 'border-primary' : ''}
            ${readOnly ? '' : 'cursor-move'}
            transition-all duration-200
          `}
          draggable={!readOnly}
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
        >
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${getFlexDirection()}`}>
              {!readOnly && (
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
              )}
              
              <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                {getItemIcon(item.type)}
                <Badge variant="secondary" className="text-xs">
                  {getItemTypeLabel(item.type)}
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-medium truncate ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className={`text-sm text-muted-foreground truncate ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
                    {item.description}
                  </p>
                )}
              </div>

              <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                {item.duration && (
                  <div className={`flex items-center gap-1 text-xs text-muted-foreground ${getFlexDirection()}`}>
                    <Clock className="h-3 w-3" />
                    <span>{item.duration}</span>
                  </div>
                )}

                {item.isCompleted && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {isRTL ? 'مكتمل' : 'Voltooid'}
                  </Badge>
                )}

                {!readOnly && (
                  <div className={`flex items-center gap-1 ${getFlexDirection()}`}>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};