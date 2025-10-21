import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Copy, 
  Reply, 
  Edit3, 
  Trash2,
  Download,
  Eye,
  User,
  Check,
  CheckCheck
} from 'lucide-react';
import { Message } from '@/services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  className?: string;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = false,
  className,
  onReply,
  onEdit,
  onDelete
}: MessageBubbleProps) {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const { isRTL } = useRTLLayout();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('nl-NL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }

    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: nl 
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const renderAttachments = () => {
    if (!message.attachments?.length) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, index) => {
          const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isVideo = attachment.match(/\.(mp4|webm|ogg)$/i);
          const isAudio = attachment.match(/\.(mp3|wav|ogg|m4a)$/i);
          
          const filename = attachment.split('/').pop() || 'attachment';

          if (isImage && !imageError[attachment]) {
            return (
              <div key={index} className="relative max-w-xs">
                <img
                  src={attachment}
                  alt="Attachment"
                  className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(attachment, '_blank')}
                  onError={() => setImageError(prev => ({ ...prev, [attachment]: true }))}
                  loading="lazy"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(attachment, '_blank');
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            );
          }

          if (isVideo) {
            return (
              <video
                key={index}
                controls
                className="max-w-xs rounded-lg max-h-64"
                preload="metadata"
              >
                <source src={attachment} />
                Je browser ondersteunt geen video.
              </video>
            );
          }

          if (isAudio) {
            return (
              <audio
                key={index}
                controls
                className="max-w-xs"
                preload="metadata"
              >
                <source src={attachment} />
                Je browser ondersteunt geen audio.
              </audio>
            );
          }

          // Generic file attachment
          return (
            <div key={index} className="flex items-center gap-2 p-2 border rounded bg-muted/50 max-w-xs">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{filename}</p>
                <p className="text-xs text-muted-foreground">Bijlage</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => window.open(attachment, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReadReceipt = () => {
    if (!isOwn) return null;

    return (
      <div className="flex items-center justify-end mt-1">
        {message.is_read ? (
          <CheckCheck className="h-3 w-3 text-primary" />
        ) : (
          <Check className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "flex gap-3 group",
        isOwn && "flex-row-reverse",
        isRTL && !isOwn && "flex-row-reverse",
        isRTL && isOwn && "flex-row",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {message.sender?.full_name ? (
                message.sender.full_name.charAt(0).toUpperCase()
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex-1 max-w-xs sm:max-w-md", !showAvatar && "ms-11")}>
        {/* Sender info */}
        {showAvatar && !isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {message.sender?.full_name || 'Onbekend'}
            </span>
            {message.sender?.role === 'leerkracht' && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Leerkracht
              </Badge>
            )}
            {message.sender?.role === 'admin' && (
              <Badge variant="default" className="text-xs px-1.5 py-0.5">
                Admin
              </Badge>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative group">
          <div
            className={cn(
              "relative px-4 py-2 rounded-2xl break-words",
              isOwn
                ? "bg-primary text-primary-foreground ms-auto"
                : "bg-muted",
              // RTL adjustments for bubble direction
              isOwn && !isRTL && "rounded-br-md",
              isOwn && isRTL && "rounded-bl-md",
              !isOwn && !isRTL && "rounded-bl-md", 
              !isOwn && isRTL && "rounded-br-md"
            )}
          >
            {/* Message content with XSS protection */}
            <div className={cn(
              "text-sm whitespace-pre-wrap",
              isRTL && "arabic-text text-right"
            )}>
              {message.content}
            </div>

            {/* Attachments */}
            {renderAttachments()}

            {/* Message actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "absolute -top-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    "bg-background border shadow-sm hover:bg-accent",
                    isOwn ? "-left-8" : "-right-8"
                  )}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "start" : "end"}>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 me-2" />
                  Kopiëren
                </DropdownMenuItem>
                {onReply && (
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="h-4 w-4 me-2" />
                    Beantwoorden
                  </DropdownMenuItem>
                )}
                {isOwn && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(message)}>
                    <Edit3 className="h-4 w-4 me-2" />
                    Bewerken
                  </DropdownMenuItem>
                )}
                {isOwn && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(message)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    Verwijderen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Read receipt */}
          {renderReadReceipt()}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div className={cn(
            "text-xs text-muted-foreground mt-1",
            isOwn ? "text-right" : "text-left",
            isRTL && (isOwn ? "text-left" : "text-right")
          )}>
            {formatTime(message.created_at)}
          </div>
        )}
      </div>
    </div>
  );
}