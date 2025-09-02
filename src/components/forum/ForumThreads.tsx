
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageCircle } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  class_id: string;
  created_at: string;
  is_pinned: boolean;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface ForumThreadsProps {
  threads: ForumThread[];
  onThreadSelect: (threadId: string) => void;
}

const ForumThreads: React.FC<ForumThreadsProps> = ({ threads, onThreadSelect }) => {
  const { getFlexDirection, getTextAlign } = useRTLLayout();
  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Nog geen onderwerpen"
        description="Wees de eerste om een onderwerp te plaatsen in deze kamer!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card 
          key={thread.id} 
          className="cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => onThreadSelect(thread.id)}
        >
          <CardHeader className="pb-3">
            <div className={`flex items-start justify-between ${getFlexDirection()}`}>
              <div className="space-y-1">
                <CardTitle className={`text-lg flex items-center gap-2 ${getFlexDirection()}`}>
                  {thread.is_pinned && (
                    <Badge variant="secondary" className="text-xs">
                      Vastgepind
                    </Badge>
                  )}
                  {thread.title}
                </CardTitle>
                <div className={`text-sm text-muted-foreground ${getTextAlign()}`}>
                  Door {thread.profiles?.full_name || 'Onbekende gebruiker'} • {new Date(thread.created_at).toLocaleDateString('nl-NL')}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {thread.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ForumThreads;
