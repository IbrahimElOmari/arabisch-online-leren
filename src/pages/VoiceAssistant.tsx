import React from 'react';
import { VoiceAssistant as VoiceAssistantComponent } from '@/components/voice/VoiceAssistant';

const VoiceAssistant = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">مساعد النطق - Voice Assistant</h1>
        <p className="text-muted-foreground">
          تدرب على النطق الصحيح للغة العربية مع الذكاء الاصطناعي
          <br />
          Practice Arabic pronunciation with AI assistance
        </p>
      </div>
      
      <VoiceAssistantComponent />
    </div>
  );
};

export default VoiceAssistant;