
import React, { useEffect } from 'react';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  skipToMainId?: string;
  announcementText?: string;
}

export const AccessibilityWrapper = ({ 
  children, 
  skipToMainId = "main-content",
  announcementText 
}: AccessibilityWrapperProps) => {
  useEffect(() => {
    if (announcementText) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = announcementText;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [announcementText]);

  return (
    <>
      <a 
        href={`#${skipToMainId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Spring naar hoofdinhoud
      </a>
      {children}
    </>
  );
};
