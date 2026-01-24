import { z } from 'zod';

// ============================================
// CONVERSATION TYPE SCHEMAS
// ============================================

export const conversationTypeSchema = z.enum(['dm', 'class', 'group']);

export const participantRoleSchema = z.enum([
  'member',
  'owner', 
  'leerkracht',
  'admin',
  'moderator',
]);

// ============================================
// PARTICIPANT SCHEMAS
// ============================================

export const userInfoSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).max(200),
  role: z.string(),
  avatar_url: z.string().url().nullable().optional(),
});

export const conversationParticipantSchema = z.object({
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: participantRoleSchema,
  joined_at: z.string().datetime(),
  last_read_at: z.string().datetime().optional(),
  user: userInfoSchema.optional(),
});

// ============================================
// MESSAGE SCHEMAS
// ============================================

export const attachmentSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'file', 'audio', 'video']),
  name: z.string().max(255),
  size: z.number().min(0).max(100 * 1024 * 1024), // Max 100MB
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  attachments: z.array(attachmentSchema).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  edited_at: z.string().datetime().nullable().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  sender: userInfoSchema.optional(),
  is_read: z.boolean().optional(),
  reply_to_id: z.string().uuid().nullable().optional(),
});

export const messageReadSchema = z.object({
  message_id: z.string().uuid(),
  user_id: z.string().uuid(),
  read_at: z.string().datetime(),
});

// ============================================
// CONVERSATION SCHEMAS
// ============================================

export const conversationSchema = z.object({
  id: z.string().uuid(),
  type: conversationTypeSchema,
  class_id: z.string().uuid().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  title: z.string().max(200).nullable().optional(),
  participants: z.array(conversationParticipantSchema).optional(),
  last_message: z.lazy(() => messageSchema).optional(),
  unread_count: z.number().int().min(0).optional(),
  is_muted: z.boolean().optional(),
});

// ============================================
// INPUT SCHEMAS (for validation)
// ============================================

export const createConversationInputSchema = z.object({
  type: conversationTypeSchema,
  class_id: z.string().uuid().optional(),
  participant_ids: z.array(z.string().uuid()).min(1).max(100),
  title: z.string().min(1).max(200).optional(),
});

export const sendMessageInputSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  attachments: z.array(attachmentSchema).max(10).optional(),
  reply_to_id: z.string().uuid().optional(),
});

export const updateMessageInputSchema = z.object({
  message_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

export const deleteMessageInputSchema = z.object({
  message_id: z.string().uuid(),
  soft_delete: z.boolean().default(true),
});

export const listMessagesOptionsSchema = z.object({
  conversation_id: z.string().uuid(),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  direction: z.enum(['older', 'newer']).default('older'),
});

export const markAsReadInputSchema = z.object({
  conversation_id: z.string().uuid(),
  message_id: z.string().uuid().optional(), // If not provided, mark all as read
});

// ============================================
// RESPONSE SCHEMAS
// ============================================

export const listMessagesResponseSchema = z.object({
  messages: z.array(messageSchema),
  hasMore: z.boolean(),
  nextCursor: z.string().datetime().nullable(),
});

export const conversationListResponseSchema = z.array(conversationSchema);

export const unreadCountResponseSchema = z.object({
  total: z.number().int().min(0),
  by_conversation: z.record(z.string().uuid(), z.number().int().min(0)),
});

// ============================================
// REALTIME EVENT SCHEMAS
// ============================================

export const messageEventSchema = z.object({
  event_type: z.enum(['new_message', 'message_updated', 'message_deleted']),
  payload: messageSchema,
});

export const typingEventSchema = z.object({
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_typing: z.boolean(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type ConversationType = z.infer<typeof conversationTypeSchema>;
export type ParticipantRole = z.infer<typeof participantRoleSchema>;
export type UserInfo = z.infer<typeof userInfoSchema>;
export type ConversationParticipant = z.infer<typeof conversationParticipantSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessageRead = z.infer<typeof messageReadSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageInputSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageInputSchema>;
export type ListMessagesOptions = z.infer<typeof listMessagesOptionsSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadInputSchema>;
export type ListMessagesResponse = z.infer<typeof listMessagesResponseSchema>;
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;
export type UnreadCountResponse = z.infer<typeof unreadCountResponseSchema>;
export type MessageEvent = z.infer<typeof messageEventSchema>;
export type TypingEvent = z.infer<typeof typingEventSchema>;
