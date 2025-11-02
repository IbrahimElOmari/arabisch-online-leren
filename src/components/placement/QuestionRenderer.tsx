import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'drag_drop' | 'fill_blank' | 'audio' | 'voice' | 'sequence';
  options?: string[];
  pairs?: { left: string; right: string }[];
  items?: string[];
  audio_url?: string;
}

interface QuestionRendererProps {
  question: Question;
  answer: any;
  onChange: (answer: any) => void;
}

export const QuestionRenderer = ({ question, answer, onChange }: QuestionRendererProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  switch (question.question_type) {
    case 'multiple_choice':
      return (
        <div className="space-y-4">
          <p className="text-lg font-medium">{question.question_text}</p>
          <RadioGroup value={answer || ''} onValueChange={onChange}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`q-${question.id}-${index}`} />
                <Label htmlFor={`q-${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'fill_blank':
      return (
        <div className="space-y-4">
          <p className="text-lg font-medium">{question.question_text}</p>
          <Input
            type="text"
            value={answer || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            className="max-w-md"
          />
        </div>
      );

    case 'drag_drop':
      const pairs = question.pairs || [];
      const answerPairs = (answer as Array<{ left: string; right: string }>) || pairs.map(p => ({ left: p.left, right: '' }));
      
      return (
        <div className="space-y-4">
          <p className="text-lg font-medium">{question.question_text}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="font-medium text-sm text-muted-foreground">Match items</p>
              {answerPairs.map((pair, index) => (
                <div key={index} className="p-3 bg-secondary rounded-lg">
                  {pair.left}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm text-muted-foreground">With options</p>
              {answerPairs.map((pair, index) => (
                <select
                  key={index}
                  value={pair.right}
                  onChange={(e) => {
                    const newPairs = [...answerPairs];
                    newPairs[index].right = e.target.value;
                    onChange(newPairs);
                  }}
                  className="w-full p-3 bg-background border rounded-lg"
                >
                  <option value="">Select match...</option>
                  {pairs.map((p, i) => (
                    <option key={i} value={p.right}>{p.right}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        </div>
      );

    case 'sequence':
      const items = question.items || [];
      const sequence = (answer as string[]) || items;
      
      const handleDragStart = (index: number) => {
        setDraggedIndex(index);
      };

      const handleDrop = (dropIndex: number) => {
        if (draggedIndex === null) return;
        
        const newSequence = [...sequence];
        const [draggedItem] = newSequence.splice(draggedIndex, 1);
        newSequence.splice(dropIndex, 0, draggedItem);
        
        onChange(newSequence);
        setDraggedIndex(null);
      };

      return (
        <div className="space-y-4">
          <p className="text-lg font-medium">{question.question_text}</p>
          <p className="text-sm text-muted-foreground">Drag to reorder the items in the correct sequence</p>
          <div className="space-y-2">
            {sequence.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className="flex items-center gap-2 p-3 bg-secondary rounded-lg cursor-move hover:bg-secondary/80 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1">{item}</span>
                <span className="text-sm text-muted-foreground">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'audio':
    case 'voice':
      return (
        <div className="space-y-4">
          <p className="text-lg font-medium">{question.question_text}</p>
          {question.audio_url && (
            <audio controls className="w-full max-w-md">
              <source src={question.audio_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
          <Input
            type="text"
            value={answer || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type what you heard..."
            className="max-w-md"
          />
        </div>
      );

    default:
      return (
        <div className="p-4 border border-destructive rounded-lg">
          <p className="text-destructive">Unknown question type: {question.question_type}</p>
        </div>
      );
  }
};
