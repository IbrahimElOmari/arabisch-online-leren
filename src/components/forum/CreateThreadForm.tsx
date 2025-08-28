
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send } from 'lucide-react';

interface CreateThreadFormProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
}

const CreateThreadForm: React.FC<CreateThreadFormProps> = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nieuw Onderwerp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Titel van het onderwerp"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <Textarea
          placeholder="Beschrijf je onderwerp..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={4}
        />
        <Button onClick={onSubmit}>
          <Send className="h-4 w-4 mr-2" />
          Onderwerp Plaatsen
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateThreadForm;
