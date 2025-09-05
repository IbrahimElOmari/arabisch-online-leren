import React from 'react';
import { CollaborativeWhiteboard as CollaborativeWhiteboardComponent } from '@/components/collaboration/CollaborativeWhiteboard';

const Whiteboard = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">اللوحة التعاونية - Collaborative Whiteboard</h1>
        <p className="text-muted-foreground">
          ارسم وتعاون مع الآخرين في الوقت الفعلي
          <br />
          Draw and collaborate with others in real-time
        </p>
      </div>
      
      <CollaborativeWhiteboardComponent />
    </div>
  );
};

export default Whiteboard;