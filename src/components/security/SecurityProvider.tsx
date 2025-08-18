
import React from 'react';
import { SecurityMonitor } from './SecurityMonitor';
import { SecurityErrorBoundary } from './SecurityErrorBoundary';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  return (
    <SecurityErrorBoundary>
      <SecurityMonitor>
        {children}
      </SecurityMonitor>
    </SecurityErrorBoundary>
  );
};
