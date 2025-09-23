import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Types
export interface Conversation {
  id: string;
  type: 'dm' | 'class';
  class_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  role: 'member' | 'owner' | 'leerkracht' | 'admin';
  joined_at: string;
  user?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string;
    role: string;
  };
  is_read?: boolean;
}

// Database response types (for proper typing)
interface ConversationRow {
  id: string;
  type: string;
  class_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: any; // Json type from Supabase
  created_at: string;
  updated_at: string;
}

export interface MessageRead {
  message_id: string;
  user_id: string;
  read_at: string;
}

// Validation schemas
export const createConversationSchema = z.object({
  type: z.enum(['dm', 'class']),
  class_id: z.string().uuid().optional(),
  participant_ids: z.array(z.string().uuid()).min(1),
});

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  attachments: z.array(z.string()).optional(),
});

// Chat Service
export class ChatService {
  // Helper to convert database row to Conversation type
  private static convertToConversation(row: any): Conversation {
    return {
      ...row,
      type: row.type as 'dm' | 'class',
    };
  }

  // Helper to convert database row to Message type
  private static convertToMessage(row: any): Message {
    return {
      ...row,
      attachments: Array.isArray(row.attachments) ? row.attachments : [],
    };
  }

  static async createConversation(data: z.infer<typeof createConversationSchema>): Promise<Conversation> {
    const validated = createConversationSchema.parse(data);
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        type: validated.type,
        class_id: validated.class_id || null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add participants
    const participants = validated.participant_ids.map(user_id => ({
      conversation_id: conversation.id,
      user_id,
      role: user_id === conversation.created_by ? 'owner' : 'member',
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (participantsError) throw participantsError;

    return this.convertToConversation(conversation);
  }

  static async listConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          user:profiles(id, full_name, role)
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get unread counts and last messages
    const conversationsWithMeta = await Promise.all(
      data.map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*, sender:profiles(id, full_name, role)')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', conv.id)
          .not('id', 'in', `(
            SELECT message_id FROM message_reads 
            WHERE user_id = '${(await supabase.auth.getUser()).data.user?.id}'
          )`);

        return {
          ...this.convertToConversation(conv),
          last_message: lastMessage ? this.convertToMessage(lastMessage) : undefined,
          unread_count: unreadCount || 0,
        };
      })
    );

    return conversationsWithMeta;
  }

  static async listMessages(
    conversationId: string,
    options: { cursor?: string; limit?: number } = {}
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const limit = options.limit || 50;
    
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(id, full_name, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (options.cursor) {
      query = query.lt('created_at', options.cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasMore = data.length > limit;
    const messages = hasMore ? data.slice(0, limit) : data;

    // Check read status for current user
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const messagesWithReadStatus = await Promise.all(
      messages.map(async (message) => {
        const { data: readStatus } = await supabase
          .from('message_reads')
          .select('read_at')
          .eq('message_id', message.id)
          .eq('user_id', userId)
          .single();

        return {
          ...this.convertToMessage(message),
          is_read: !!readStatus,
        };
      })
    );

    return {
      messages: messagesWithReadStatus.reverse(), // Reverse to show oldest first
      hasMore,
    };
  }

  static async sendMessage(data: z.infer<typeof sendMessageSchema>): Promise<Message> {
    const validated = sendMessageSchema.parse(data);
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: validated.conversation_id,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        content: validated.content,
        attachments: validated.attachments || [],
      })
      .select(`
        *,
        sender:profiles(id, full_name, role)
      `)
      .single();

    if (error) throw error;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validated.conversation_id);

    return this.convertToMessage(message);
  }

  static async markAsRead(messageId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    const { error } = await supabase
      .from('message_reads')
      .upsert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  static async markConversationAsRead(conversationId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // Get all unread messages in conversation
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .not('id', 'in', `(
        SELECT message_id FROM message_reads 
        WHERE user_id = '${userId}'
      )`);

    if (!messages?.length) return;

    // Mark all as read
    const reads = messages.map(msg => ({
      message_id: msg.id,
      user_id: userId,
      read_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('message_reads')
      .upsert(reads);

    if (error) throw error;
  }

  static async uploadAttachment(file: File, conversationId: string): Promise<string> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${conversationId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('chat_attachments')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('chat_attachments')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  static subscribeToConversation(
    conversationId: string,
    onMessage: (message: Message) => void,
    onRead: (read: MessageRead) => void
  ) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
        },
        (payload) => {
          onRead(payload.new as MessageRead);
        }
      )
      .subscribe();
  }
}