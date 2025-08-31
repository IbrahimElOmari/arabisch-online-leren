
import React from 'react';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

interface SecurityWrapperProps {
  children: React.ReactNode;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ children }) => {
  // Initialize security monitoring and notifications
  useTaskNotifications();
  useSecurityMonitoring();

  return <>{children}</>;
};
