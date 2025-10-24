import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Download, FileJson, Loader2 } from 'lucide-react';
import { gdprService } from '@/services/gdprService';
import { useToast } from '@/hooks/use-toast';
import { auditService } from '@/services/auditService';

interface DataExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  open,
  onOpenChange
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await gdprService.downloadUserDataAsFile();
      await auditService.logDataExport(
        (await gdprService.exportUserData()).user_id,
        'full_export'
      );

      toast({
        title: t('gdpr.export.success'),
        description: t('gdpr.export.successMessage')
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('error.title'),
        description: t('gdpr.export.failed'),
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            {t('gdpr.export.title')}
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>{t('gdpr.export.description')}</p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-2">{t('gdpr.export.includedData')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('gdpr.export.profile')}</li>
                <li>{t('gdpr.export.enrollments')}</li>
                <li>{t('gdpr.export.forumPosts')}</li>
                <li>{t('gdpr.export.submissions')}</li>
                <li>{t('gdpr.export.messages')}</li>
                <li>{t('gdpr.export.consents')}</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('gdpr.export.exporting')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t('gdpr.export.download')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
