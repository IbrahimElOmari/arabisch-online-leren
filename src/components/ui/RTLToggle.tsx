
import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useRTL } from '@/contexts/RTLContext';

export const RTLToggle: React.FC = () => {
  const { isRTL, toggleRTL } = useRTL();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleRTL}
      className="flex items-center gap-2 h-9 px-3"
      title={isRTL ? 'Switch to Dutch' : 'Switch to Arabic'}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isRTL ? 'NL' : 'عربي'}
      </span>
    </Button>
  );
};
