import { describe, it, expect } from 'vitest';
import {
  curriculumLevelSchema,
  contentMappingSchema,
  studentProgressInputSchema,
  levelCompletionResultSchema,
  completionCriteriaSchema,
  cefrLevelSchema,
  learningPillarSchema,
} from '@/schemas/curriculum.schema';
import {
  // conversationSchema - used for reference, tested via message tests
  messageSchema,
  createConversationInputSchema,
  sendMessageInputSchema,
  listMessagesOptionsSchema,
  attachmentSchema,
  conversationParticipantSchema,
  markAsReadInputSchema,
} from '@/schemas/chat.schema';

// ============================================
// CURRICULUM SCHEMA TESTS
// ============================================

describe('Curriculum Schemas', () => {
  describe('completionCriteriaSchema', () => {
    it('should validate valid completion criteria', () => {
      const result = completionCriteriaSchema.safeParse({
        theory_score: 80,
        practice_score: 75,
        consistency_weeks: 4,
      });
      expect(result.success).toBe(true);
    });

    it('should reject scores above 100', () => {
      const result = completionCriteriaSchema.safeParse({
        theory_score: 110,
        practice_score: 75,
        consistency_weeks: 4,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative scores', () => {
      const result = completionCriteriaSchema.safeParse({
        theory_score: -10,
        practice_score: 75,
        consistency_weeks: 4,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('cefrLevelSchema', () => {
    it('should accept valid CEFR levels', () => {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      levels.forEach((level) => {
        const result = cefrLevelSchema.safeParse(level);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid CEFR levels', () => {
      const result = cefrLevelSchema.safeParse('X1');
      expect(result.success).toBe(false);
    });
  });

  describe('curriculumLevelSchema', () => {
    const validLevel = {
      id: 1,
      key: 'basis',
      nl: 'Basis',
      en: 'Beginner',
      ar: 'المبتدئ',
      description_nl: 'Alfabet, basisklanken',
      description_en: 'Alphabet, basic sounds',
      cefr: 'A1',
      estimated_hours: 50,
      completion_criteria: {
        theory_score: 80,
        practice_score: 75,
        consistency_weeks: 3,
      },
    };

    it('should validate a complete curriculum level', () => {
      const result = curriculumLevelSchema.safeParse(validLevel);
      expect(result.success).toBe(true);
    });

    it('should reject invalid level key', () => {
      const result = curriculumLevelSchema.safeParse({
        ...validLevel,
        key: 'invalid_key',
      });
      expect(result.success).toBe(false);
    });

    it('should reject level id out of range', () => {
      const result = curriculumLevelSchema.safeParse({
        ...validLevel,
        id: 10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject estimated hours too low', () => {
      const result = curriculumLevelSchema.safeParse({
        ...validLevel,
        estimated_hours: 5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('learningPillarSchema', () => {
    it('should validate a valid learning pillar', () => {
      const result = learningPillarSchema.safeParse({
        key: 'reading',
        nl: 'Lezen',
        en: 'Reading',
        ar: 'القراءة',
        description_nl: 'Leesvaardigheid ontwikkelen',
        description_en: 'Develop reading skills',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid pillar key', () => {
      const result = learningPillarSchema.safeParse({
        key: 'invalid_pillar',
        nl: 'Test',
        en: 'Test',
        ar: 'اختبار',
        description_nl: 'Test',
        description_en: 'Test',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('contentMappingSchema', () => {
    it('should validate content mapping', () => {
      const result = contentMappingSchema.safeParse({
        content_id: '550e8400-e29b-41d4-a716-446655440000',
        content_type: 'lesson',
        niveau_id: '550e8400-e29b-41d4-a716-446655440001',
        pillar: 'reading',
        topics: ['alfabet', 'klanken'],
        difficulty: 'easy',
        estimated_minutes: 30,
      });
      expect(result.success).toBe(true);
    });

    it('should require at least one topic', () => {
      const result = contentMappingSchema.safeParse({
        content_id: '550e8400-e29b-41d4-a716-446655440000',
        content_type: 'lesson',
        niveau_id: '550e8400-e29b-41d4-a716-446655440001',
        pillar: 'reading',
        topics: [],
        difficulty: 'easy',
        estimated_minutes: 30,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid difficulty', () => {
      const result = contentMappingSchema.safeParse({
        content_id: '550e8400-e29b-41d4-a716-446655440000',
        content_type: 'lesson',
        niveau_id: '550e8400-e29b-41d4-a716-446655440001',
        pillar: 'reading',
        topics: ['test'],
        difficulty: 'impossible',
        estimated_minutes: 30,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('studentProgressInputSchema', () => {
    it('should validate student progress input', () => {
      const result = studentProgressInputSchema.safeParse({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        module_id: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional niveau_id', () => {
      const result = studentProgressInputSchema.safeParse({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        module_id: '550e8400-e29b-41d4-a716-446655440001',
        niveau_id: '550e8400-e29b-41d4-a716-446655440002',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('levelCompletionResultSchema', () => {
    it('should validate level completion result', () => {
      const result = levelCompletionResultSchema.safeParse({
        completed: true,
        theory_score: 85,
        practice_score: 80,
        consistency_weeks: 5,
        missing: [],
      });
      expect(result.success).toBe(true);
    });

    it('should validate incomplete result with missing items', () => {
      const result = levelCompletionResultSchema.safeParse({
        completed: false,
        theory_score: 60,
        practice_score: 55,
        consistency_weeks: 2,
        missing: ['theory_score', 'consistency'],
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// CHAT SCHEMA TESTS
// ============================================

describe('Chat Schemas', () => {
  describe('attachmentSchema', () => {
    it('should validate a valid attachment', () => {
      const result = attachmentSchema.safeParse({
        url: 'https://example.com/file.pdf',
        type: 'file',
        name: 'document.pdf',
        size: 1024000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject file too large', () => {
      const result = attachmentSchema.safeParse({
        url: 'https://example.com/file.pdf',
        type: 'file',
        name: 'huge-file.pdf',
        size: 200 * 1024 * 1024, // 200MB
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const result = attachmentSchema.safeParse({
        url: 'not-a-url',
        type: 'file',
        name: 'file.pdf',
        size: 1024,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('messageSchema', () => {
    const validMessage = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      conversation_id: '550e8400-e29b-41d4-a716-446655440001',
      sender_id: '550e8400-e29b-41d4-a716-446655440002',
      content: 'Hallo, hoe gaat het?',
      attachments: [],
      created_at: '2026-01-24T10:00:00Z',
      updated_at: '2026-01-24T10:00:00Z',
    };

    it('should validate a valid message', () => {
      const result = messageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const result = messageSchema.safeParse({
        ...validMessage,
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept message with attachments', () => {
      const result = messageSchema.safeParse({
        ...validMessage,
        attachments: [
          {
            url: 'https://example.com/image.jpg',
            type: 'image',
            name: 'photo.jpg',
            size: 512000,
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('conversationParticipantSchema', () => {
    it('should validate a valid participant', () => {
      const result = conversationParticipantSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        role: 'member',
        joined_at: '2026-01-24T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid roles', () => {
      const roles = ['member', 'owner', 'leerkracht', 'admin', 'moderator'];
      roles.forEach((role) => {
        const result = conversationParticipantSchema.safeParse({
          conversation_id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: '550e8400-e29b-41d4-a716-446655440001',
          role,
          joined_at: '2026-01-24T10:00:00Z',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('createConversationInputSchema', () => {
    it('should validate DM conversation creation', () => {
      const result = createConversationInputSchema.safeParse({
        type: 'dm',
        participant_ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate class conversation with class_id', () => {
      const result = createConversationInputSchema.safeParse({
        type: 'class',
        class_id: '550e8400-e29b-41d4-a716-446655440000',
        participant_ids: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should require at least one participant', () => {
      const result = createConversationInputSchema.safeParse({
        type: 'dm',
        participant_ids: [],
      });
      expect(result.success).toBe(false);
    });

    it('should limit participants to 100', () => {
      const manyParticipants = Array(101)
        .fill(null)
        .map(() => '550e8400-e29b-41d4-a716-446655440000');
      
      const result = createConversationInputSchema.safeParse({
        type: 'group',
        participant_ids: manyParticipants,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sendMessageInputSchema', () => {
    it('should validate message sending', () => {
      const result = sendMessageInputSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Test bericht',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const result = sendMessageInputSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('should limit attachments to 10', () => {
      const manyAttachments = Array(11).fill({
        url: 'https://example.com/file.pdf',
        type: 'file',
        name: 'file.pdf',
        size: 1024,
      });
      
      const result = sendMessageInputSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Test',
        attachments: manyAttachments,
      });
      expect(result.success).toBe(false);
    });

    it('should accept reply_to_id', () => {
      const result = sendMessageInputSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Reply message',
        reply_to_id: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('listMessagesOptionsSchema', () => {
    it('should validate with defaults', () => {
      const result = listMessagesOptionsSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.direction).toBe('older');
      }
    });

    it('should accept custom limit', () => {
      const result = listMessagesOptionsSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 25,
      });
      expect(result.success).toBe(true);
    });

    it('should reject limit above 100', () => {
      const result = listMessagesOptionsSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('markAsReadInputSchema', () => {
    it('should validate marking conversation as read', () => {
      const result = markAsReadInputSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should validate marking specific message as read', () => {
      const result = markAsReadInputSchema.safeParse({
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        message_id: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });
  });
});
