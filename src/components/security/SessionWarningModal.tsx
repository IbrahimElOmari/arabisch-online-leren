import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SessionWarningModalProps {
  open: boolean;
  minutesRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  open,
  minutesRemaining,
  onExtend,
  onLogout,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <DialogTitle>{t('security.session.warningTitle')}</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            <div className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              <span>
                {t('security.session.warningMessage', { minutes: minutesRemaining })}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2 text-sm text-muted-foreground">
          <p>{t('security.session.warningExplanation')}</p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            {t('security.session.logoutNow')}
          </Button>
          <Button
            onClick={onExtend}
            className="w-full sm:w-auto"
          >
            {t('security.session.extendSession')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
