import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupportService, KnowledgeBaseService, ModerationService } from '@/services/supportService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('SupportService', () => {
  const mockUserId = 'user-123';
  const mockTicket = {
    id: 'ticket-123',
    user_id: mockUserId,
    subject: 'Test Ticket',
    description: 'Test Description',
    category: 'technical',
    priority: 'medium',
    status: 'open',
    ticket_number: 'TK-20250121-00001',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    } as any);
  });

  describe('createTicket', () => {
    it('should create a support ticket successfully', async () => {
      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await SupportService.createTicket({
        subject: 'Test Ticket',
        description: 'Test Description with more than 20 characters',
        category: 'technical',
        priority: 'medium',
      });

      expect(result).toEqual(mockTicket);
      expect(mockFrom.insert).toHaveBeenCalled();
    });

    it('should validate ticket data', async () => {
      await expect(
        SupportService.createTicket({
          subject: 'Too',
          description: 'Short',
          category: 'technical',
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('getMyTickets', () => {
    it('should fetch user tickets', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockTicket], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await SupportService.getMyTickets();

      expect(result).toEqual([mockTicket]);
      expect(mockFrom.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should filter by status', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockTicket], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await SupportService.getMyTickets('open');

      expect(mockFrom.eq).toHaveBeenCalledWith('status', 'open');
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockTicket, status: 'resolved' }, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await SupportService.updateTicketStatus('ticket-123', 'resolved');

      expect(result.status).toBe('resolved');
      expect(mockFrom.update).toHaveBeenCalled();
    });

    it('should set resolved_at when status is resolved', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await SupportService.updateTicketStatus('ticket-123', 'resolved');

      const updateCall = mockFrom.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('resolved_at');
    });
  });
});

describe('KnowledgeBaseService', () => {
  const mockUserId = 'user-123';
  const mockArticle = {
    id: 'article-123',
    title: 'Test Article Title',
    slug: 'test-article',
    content: 'Test article content that is longer than 50 characters for validation',
    excerpt: 'Test excerpt',
    category: 'general',
    author_id: mockUserId,
    status: 'published',
    views_count: 0,
    helpful_count: 0,
    not_helpful_count: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    } as any);
  });

  describe('createArticle', () => {
    it('should create a knowledge base article', async () => {
      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await KnowledgeBaseService.createArticle({
        title: 'Test Article Title',
        slug: 'test-article',
        content: 'Test article content that is longer than 50 characters',
        category: 'general',
      });

      expect(result).toEqual(mockArticle);
      expect(mockFrom.insert).toHaveBeenCalled();
    });

    it('should validate article data', async () => {
      await expect(
        KnowledgeBaseService.createArticle({
          title: 'Too short',
          slug: 'invalid slug!',
          content: 'Short',
          category: 'general',
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('getPublishedArticles', () => {
    it('should fetch published articles', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockArticle], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await KnowledgeBaseService.getPublishedArticles();

      expect(result).toEqual([mockArticle]);
      expect(mockFrom.eq).toHaveBeenCalledWith('status', 'published');
    });

    it('should filter by category', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockArticle], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await KnowledgeBaseService.getPublishedArticles('general');

      expect(mockFrom.eq).toHaveBeenCalledWith('category', 'general');
    });
  });

  describe('markHelpful', () => {
    it('should increment helpful count', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { helpful_count: 5, not_helpful_count: 1 }, 
          error: null 
        }),
        update: vi.fn().mockReturnThis(),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await KnowledgeBaseService.markHelpful('article-123', true);

      expect(mockFrom.update).toHaveBeenCalledWith({ helpful_count: 6 });
    });

    it('should increment not helpful count', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { helpful_count: 5, not_helpful_count: 1 }, 
          error: null 
        }),
        update: vi.fn().mockReturnThis(),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await KnowledgeBaseService.markHelpful('article-123', false);

      expect(mockFrom.update).toHaveBeenCalledWith({ not_helpful_count: 2 });
    });
  });
});

describe('ModerationService', () => {
  const mockUserId = 'user-123';
  const mockAdminId = 'admin-456';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: mockAdminId } },
      error: null,
    } as any);
  });

  describe('issueWarning', () => {
    it('should issue a warning to a user', async () => {
      const mockWarning = {
        id: 'warning-123',
        user_id: mockUserId,
        issued_by: mockAdminId,
        reason: 'Test warning',
        severity: 'minor',
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockWarning, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await ModerationService.issueWarning(mockUserId, 'Test warning', 'minor');

      expect(result).toEqual(mockWarning);
      expect(mockFrom.insert).toHaveBeenCalled();
    });
  });

  describe('banUser', () => {
    it('should ban a user temporarily', async () => {
      const mockBan = {
        id: 'ban-123',
        user_id: mockUserId,
        banned_by: mockAdminId,
        reason: 'Test ban',
        ban_type: 'temporary',
        is_active: true,
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBan, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await ModerationService.banUser(
        mockUserId, 
        'Test ban', 
        'temporary', 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      );

      expect(result).toEqual(mockBan);
      expect(mockFrom.insert).toHaveBeenCalled();
    });

    it('should ban a user permanently', async () => {
      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await ModerationService.banUser(mockUserId, 'Serious violation', 'permanent');

      const insertCall = mockFrom.insert.mock.calls[0][0];
      expect(insertCall.ban_type).toBe('permanent');
    });
  });

  describe('liftBan', () => {
    it('should lift an active ban', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_active: false }, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await ModerationService.liftBan('ban-123', 'User apologized');

      expect(result.is_active).toBe(false);
      expect(mockFrom.update).toHaveBeenCalled();
    });
  });

  describe('updateReputation', () => {
    it('should update user reputation', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { reputation_score: 100, helpful_posts: 5 }, 
          error: null 
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await ModerationService.updateReputation(mockUserId, { 
        reputation_score: 10,
        helpful_posts: 1,
      });

      const upsertCall = mockFrom.upsert.mock.calls[0][0];
      expect(upsertCall.reputation_score).toBe(110);
      expect(upsertCall.helpful_posts).toBe(6);
    });
  });

  describe('getUserWarnings', () => {
    it('should fetch user warnings', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await ModerationService.getUserWarnings(mockUserId);

      expect(mockFrom.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });
  });

  describe('getActiveBans', () => {
    it('should fetch active bans', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await ModerationService.getActiveBans();

      expect(mockFrom.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should filter by user ID', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await ModerationService.getActiveBans(mockUserId);

      expect(mockFrom.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });
  });
});
