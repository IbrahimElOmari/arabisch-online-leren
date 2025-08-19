
import React from 'react';
import { SecurityErrorBoundary } from '../error/SecurityErrorBoundary';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  return (
    <SecurityErrorBoundary>
      {children}
    </SecurityErrorBoundary>
  );
};
