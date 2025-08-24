
import { useAuth } from './AuthProviderQuery';
import { useEffect, useState } from 'react';

interface AppGateProps {
  children: React.ReactNode;
}

export const AppGate = ({ children }: AppGateProps) => {
  const { loading } = useAuth();
  const [showForceUnlock, setShowForceUnlock] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Show force unlock button after 2 seconds if still loading
    const timer = setTimeout(() => {
      if (loading && !isUnlocked) {
        console.debug('⚠️ AppGate: Showing force unlock after 2s timeout');
        setShowForceUnlock(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, isUnlocked]);

  useEffect(() => {
    // Auto-unlock after 3 seconds maximum
    const maxTimer = setTimeout(() => {
      if (loading && !isUnlocked) {
        console.debug('🔓 AppGate: Force unlocking after 3s maximum wait');
        setIsUnlocked(true);
      }
    }, 3000);

    return () => clearTimeout(maxTimer);
  }, [loading, isUnlocked]);

  if (loading && !isUnlocked) {
    console.debug('⏳ AppGate: Loading state, showing global loader');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-lg mb-4">Laden...</div>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        {showForceUnlock && (
          <button
            onClick={() => {
              console.debug('🔓 AppGate: Force unlock clicked');
              setIsUnlocked(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Ga Door
          </button>
        )}
      </div>
    );
  }

  console.debug('✅ AppGate: Rendering app content');
  return <>{children}</>;
};

