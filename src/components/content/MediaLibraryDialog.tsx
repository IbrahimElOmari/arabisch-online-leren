import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon, Video, Music } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MediaLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectMedia: (url: string, alt: string) => void;
}

interface MediaItem {
  id: string;
  file_name: string;
  file_type: string;
  public_url: string;
  alt_text: string | null;
  created_at: string;
}

export const MediaLibraryDialog = ({ open, onClose, onSelectMedia }: MediaLibraryDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('media-list', {
        body: { limit: 50, offset: 0 }
      });

      if (error) throw error;
      setMedia(data.media || []);
    } catch (error) {
      console.error('Failed to load media:', error);
      toast({
        title: t('error', 'Error'),
        description: t('media.loadFailed', 'Failed to load media library'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAltText(file.name.split('.')[0]); // Default alt text
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('alt_text', altText);
      formData.append('tags', tags);

      const { data, error } = await supabase.functions.invoke('media-upload', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: t('success', 'Success'),
        description: t('media.uploadSuccess', 'Media uploaded successfully')
      });

      // Refresh media list
      loadMedia();
      
      // Reset form
      setSelectedFile(null);
      setAltText('');
      setTags('');
      
      // Optionally insert immediately
      if (data.media?.public_url) {
        onSelectMedia(data.media.public_url, data.media.alt_text || '');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('error', 'Error'),
        description: t('media.uploadFailed', 'Failed to upload media'),
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <ImageIcon className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('media.library', 'Media Library')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse">{t('media.browse', 'Browse')}</TabsTrigger>
            <TabsTrigger value="upload">{t('media.upload', 'Upload')}</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('media.noMedia', 'No media files found. Upload some files to get started.')}
              </p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => onSelectMedia(item.public_url, item.alt_text || item.file_name)}
                  >
                    {item.file_type === 'image' ? (
                      <img
                        src={item.public_url}
                        alt={item.alt_text || item.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        {getFileIcon(item.file_type)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <p className="text-white text-xs p-2 truncate w-full">
                        {item.file_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">{t('media.selectFile', 'Select File')}</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,video/mp4,audio/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="altText">{t('media.altText', 'Alt Text (for accessibility)')}</Label>
                <Input
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder={t('media.altTextPlaceholder', 'Describe this media file')}
                  disabled={uploading}
                />
              </div>

              <div>
                <Label htmlFor="tags">{t('media.tags', 'Tags (comma separated)')}</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="lesson, chapter1, arabic"
                  disabled={uploading}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('media.uploading', 'Uploading...')}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('media.uploadButton', 'Upload Media')}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
