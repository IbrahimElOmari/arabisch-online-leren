
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

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
  const { getFlexDirection, getTextAlign, getMarginEnd } = useRTLLayout();
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${getFlexDirection()} items-center gap-2 ${getTextAlign('left')}`}>
          <Plus className="h-5 w-5" />
          {t('forum.newTopic')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder={t('forum.topicTitle')}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={getTextAlign('left')}
        />
        <Textarea
          placeholder={t('forum.topicDescription')}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={4}
          className={getTextAlign('left')}
        />
        <Button onClick={onSubmit} className={getFlexDirection()}>
          <Send className={`h-4 w-4 ${getMarginEnd('2')}`} />
          {t('forum.postTopic')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateThreadForm;
