
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageCircle } from 'lucide-react';

interface ForumRoom {
  id: string;
  name: string;
  class_name: string;
  level_name: string;
  post_count?: number;
}

interface ForumRoomsProps {
  rooms: ForumRoom[];
  onRoomSelect: (roomId: string) => void;
}

const ForumRooms: React.FC<ForumRoomsProps> = ({ rooms, onRoomSelect }) => {
  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Geen kamers beschikbaar"
        description="Er zijn nog geen forum kamers voor deze klas."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <Card 
          key={room.id} 
          className="cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => onRoomSelect(room.id)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5" />
              {room.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {room.class_name}
              </div>
              <Badge variant="outline" className="text-xs">
                {room.level_name}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ForumRooms;
