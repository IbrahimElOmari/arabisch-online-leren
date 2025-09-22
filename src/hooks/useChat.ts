import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import { ChatService, Conversation, Message } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
};

// Hooks for conversations
export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: ChatService.listConversations,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ChatService.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      toast({
        title: "Gesprek gestart",
        description: "Het nieuwe gesprek is aangemaakt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: "Kon gesprek niet aanmaken: " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Hooks for messages
export function useMessages(conversationId?: string, options: { limit?: number } = {}) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId || ''),
    queryFn: () => conversationId ? ChatService.listMessages(conversationId, options) : Promise.resolve({ messages: [], hasMore: false }),
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ChatService.sendMessage,
    onSuccess: (_, variables) => {
      // Optimistically update messages
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.conversation_id) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen: " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ChatService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ChatService.markConversationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

// Realtime subscription hook
export function useChatRealtime(conversationId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const handleNewMessage = useCallback((message: Message) => {
    // Update messages cache
    queryClient.setQueryData(
      chatKeys.messages(conversationId || ''),
      (old: { messages: Message[]; hasMore: boolean } | undefined) => {
        if (!old) return { messages: [message], hasMore: false };
        return {
          ...old,
          messages: [...old.messages, message],
        };
      }
    );
    
    // Update conversations cache with new last message
    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
  }, [queryClient, conversationId]);

  const handleMessageRead = useCallback(() => {
    // Invalidate queries to refresh read status
    queryClient.invalidateQueries({ queryKey: chatKeys.all });
  }, [queryClient]);

  useEffect(() => {
    if (!conversationId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Subscribe to new conversation
    channelRef.current = ChatService.subscribeToConversation(
      conversationId,
      handleNewMessage,
      handleMessageRead
    );

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [conversationId, handleNewMessage, handleMessageRead]);

  return { isConnected: !!channelRef.current };
}

// Upload attachment hook
export function useUploadAttachment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ file, conversationId }: { file: File; conversationId: string }) =>
      ChatService.uploadAttachment(file, conversationId),
    onError: (error) => {
      toast({
        title: "Upload mislukt",
        description: "Kon bestand niet uploaden: " + error.message,
        variant: "destructive",
      });
    },
  });
}