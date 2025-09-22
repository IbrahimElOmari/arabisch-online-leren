import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUploadAttachment, useSendMessage } from '@/hooks/useChat';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface MessageInputProps {
  conversationId: string;
  placeholder?: string;
  className?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const messageSchema = z.object({
  content: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000, 'Bericht is te lang'),
});

export function MessageInput({ 
  conversationId, 
  placeholder = "Type een bericht...",
  className,
  onTypingStart,
  onTypingStop
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { isRTL } = useRTLLayout();
  const { toast } = useToast();
  const sendMessage = useSendMessage();
  const uploadAttachment = useUploadAttachment();

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.();
    }, 3000);
  }, [isTyping, onTypingStart, onTypingStop]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    onTypingStop?.();
  }, [onTypingStop]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    if (e.target.value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = async () => {
    const validation = messageSchema.safeParse({ content: content.trim() });
    
    if (!validation.success) {
      toast({
        title: "Ongeldige invoer",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessage.mutateAsync({
        conversation_id: conversationId,
        content: content.trim(),
      });

      setContent('');
      handleTypingStop();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Bestand te groot",
        description: "Het bestand mag maximaal 20MB zijn.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await uploadAttachment.mutateAsync({ file, conversationId });
      
      // Send message with attachment
      await sendMessage.mutateAsync({
        conversation_id: conversationId,
        content: file.name,
        attachments: [url],
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const isLoading = sendMessage.isPending || uploadAttachment.isPending;
  const canSend = content.trim() && !isLoading;

  return (
    <div 
      className={cn("p-4 border-t bg-background", className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={cn(
          "relative flex items-end gap-2 p-3 border rounded-lg transition-colors",
          isDragOver && "border-primary bg-primary/5",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
        />

        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFileSelect}
          disabled={isLoading}
          className="flex-shrink-0"
        >
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Bestand bijvoegen</span>
        </Button>

        {/* Message textarea */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent p-0",
            "focus:ring-0 focus-visible:ring-0",
            isRTL && "text-right arabic-text"
          )}
          rows={1}
        />

        {/* Emoji button (placeholder for future emoji picker) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="flex-shrink-0"
        >
          <Smile className="h-4 w-4" />
          <span className="sr-only">Emoji toevoegen</span>
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="sm"
          className="flex-shrink-0"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Bericht versturen</span>
        </Button>
      </div>

      {/* Drag over indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
          <div className="text-primary font-medium">
            Laat het bestand hier los om te uploaden
          </div>
        </div>
      )}
    </div>
  );
}