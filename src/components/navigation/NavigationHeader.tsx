
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BookOpen } from 'lucide-react';

export const NavigationHeader = React.memo(() => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      <SidebarTrigger />
      <button 
        onClick={() => navigate('/')}
        className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2"
      >
        <BookOpen className="h-7 w-7 text-primary" />
        <span className="hidden sm:block">Leer Arabisch</span>
      </button>
    </div>
  );
});

NavigationHeader.displayName = 'NavigationHeader';
