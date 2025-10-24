import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { gdprService } from '@/services/gdprService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProviderQuery';

interface DataDeletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DataDeletionModal: React.FC<DataDeletionModalProps> = ({
  open,
  onOpenChange
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      toast({
        title: t('gdpr.delete.confirmError'),
        description: t('gdpr.delete.confirmErrorMessage'),
        variant: 'destructive'
      });
      return;
    }

    setIsDeleting(true);
    try {
      await gdprService.requestAccountDeletion(reason || undefined);

      toast({
        title: t('gdpr.delete.success'),
        description: t('gdpr.delete.successMessage')
      });

      // Sign out user after deletion request
      await signOut();
      onOpenChange(false);
    } catch (error) {
      console.error('Deletion request failed:', error);
      toast({
        title: t('error.title'),
        description: t('gdpr.delete.failed'),
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('gdpr.delete.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-base font-medium">
              {t('gdpr.delete.warning')}
            </p>
            
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
              <p className="text-sm text-destructive">
                {t('gdpr.delete.permanentWarning')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">{t('gdpr.delete.reasonLabel')}</Label>
              <Textarea
                id="reason"
                placeholder={t('gdpr.delete.reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">
                {t('gdpr.delete.confirmLabel')}
              </Label>
              <Input
                id="confirm"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {t('gdpr.delete.confirmHint')}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText.toLowerCase() !== 'delete'}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('gdpr.delete.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('gdpr.delete.confirm')}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
