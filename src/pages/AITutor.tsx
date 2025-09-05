import React from 'react';
import { AITutor as AITutorComponent } from '@/components/ai/AITutor';

const AITutor = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">المدرس الذكي - AI Tutor</h1>
        <p className="text-muted-foreground">
          تفاعل مع مدرس الذكاء الاصطناعي لتعلم اللغة العربية
          <br />
          Interact with our AI tutor to learn Arabic language
        </p>
      </div>
      
      <AITutorComponent />
    </div>
  );
};

export default AITutor;