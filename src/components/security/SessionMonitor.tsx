import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { SessionWarningModal } from './SessionWarningModal';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { SECURITY_CONFIG } from '@/config/security';

export const SessionMonitor: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const timeoutMinutes = SECURITY_CONFIG.session.maxIdleMinutes;
  const warningMinutes = SECURITY_CONFIG.session.timeoutWarningMinutes;

  // Update activity timestamp on user interaction
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => setLastActivity(Date.now());
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [user]);

  // Monitor session timeout
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      const idleMinutes = Math.floor(idleTime / 60000);
      const remaining = timeoutMinutes - idleMinutes;

      setMinutesRemaining(remaining);

      // Show warning when approaching timeout
      if (remaining <= warningMinutes && remaining > 0 && !showWarning) {
        setShowWarning(true);
      }

      // Auto logout on timeout
      if (remaining <= 0) {
        handleTimeout();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [user, lastActivity, showWarning, timeoutMinutes, warningMinutes]);

  const handleTimeout = async () => {
    setShowWarning(false);
    await signOut();
    toast({
      title: t('security.session.timedOutTitle'),
      description: t('security.session.timedOutMessage'),
      variant: 'destructive',
    });
  };

  const handleExtend = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
    toast({
      title: t('security.session.extendedTitle'),
      description: t('security.session.extendedMessage'),
    });
  };

  const handleLogout = async () => {
    setShowWarning(false);
    await signOut();
  };

  if (!user) return null;

  return (
    <SessionWarningModal
      open={showWarning}
      minutesRemaining={minutesRemaining}
      onExtend={handleExtend}
      onLogout={handleLogout}
    />
  );
};
