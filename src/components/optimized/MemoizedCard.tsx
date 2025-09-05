import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MemoizedCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

export const MemoizedCard = React.memo<MemoizedCardProps>(({ 
  title, 
  children, 
  className,
  badge 
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {badge && (
          <Badge variant={badge.variant || "secondary"}>
            {badge.text}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

MemoizedCard.displayName = 'MemoizedCard';