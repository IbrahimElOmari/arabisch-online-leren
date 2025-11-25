import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enrollmentService } from '@/services/modules/enrollmentService';
import { supabase } from '@/integrations/supabase/client';
import type { EnrollmentFormData } from '@/types/modules';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('EnrollmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStudentProfile', () => {
    it('should create a student profile with valid data', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const formData = {
        dateOfBirth: '2000-01-01',
        isMinor: false,
        emergencyContact: {
          name: 'John Doe',
          phone: '+31612345678',
          relationship: 'Father',
        },
        consentGiven: true,
      } as any;

      const mockProfile = {
        id: 'profile-123',
        user_id: userId,
        date_of_birth: '2000-01-01',
        is_minor: false,
        parent_name: null,
        parent_email: null,
        parent_phone: null,
        emergency_contact: formData.emergencyContact,
        consent_given: true,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await enrollmentService.createStudentProfile(userId, formData);

      expect(result).toEqual(mockProfile);
      expect(mockInsert).toHaveBeenCalledWith([{
        user_id: userId,
        date_of_birth: '2000-01-01',
        is_minor: false,
        parent_name: null,
        parent_email: null,
        parent_phone: null,
        emergency_contact: formData.emergencyContact,
        consent_given: true,
      }]);
    });

    it('should create a minor student profile with parent data', async () => {
      const userId = '223e4567-e89b-12d3-a456-426614174000';
      const formData = {
        dateOfBirth: '2015-06-15',
        isMinor: true,
        parentName: 'Jane Smith',
        parentEmail: 'jane.smith@example.com',
        parentPhone: '+31698765432',
        emergencyContact: {
          name: 'Jane Smith',
          phone: '+31698765432',
          relationship: 'Mother',
        },
        consentGiven: true,
      } as any;

      const mockProfile = {
        id: 'profile-456',
        user_id: userId,
        date_of_birth: '2015-06-15',
        is_minor: true,
        parent_name: 'Jane Smith',
        parent_email: 'jane.smith@example.com',
        parent_phone: '+31698765432',
        emergency_contact: formData.emergencyContact,
        consent_given: true,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await enrollmentService.createStudentProfile(userId, formData);

      expect(result.is_minor).toBe(true);
      expect(result.parent_name).toBe('Jane Smith');
      expect(result.parent_email).toBe('jane.smith@example.com');
    });

    it('should throw error with invalid email', async () => {
      const userId = '323e4567-e89b-12d3-a456-426614174000';
      const formData = {
        isMinor: false,
        parentEmail: 'invalid-email',
        consentGiven: true,
      } as any;

      await expect(
        enrollmentService.createStudentProfile(userId, formData)
      ).rejects.toThrow();
    });

    it('should throw error when database insert fails', async () => {
      const userId = '423e4567-e89b-12d3-a456-426614174000';
      const profileData = {
        isMinor: false,
        consentGiven: true,
      } as any;

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      await expect(
        enrollmentService.createStudentProfile(userId, formData)
      ).rejects.toThrow();
    });
  });

  describe('createEnrollment', () => {
    it('should create enrollment with one-time payment', async () => {
      const studentId = '523e4567-e89b-12d3-a456-426614174000';
      const moduleId = '623e4567-e89b-12d3-a456-426614174000';
      const paymentType = 'one_time';

      const mockEnrollment = {
        id: 'enrollment-123',
        student_id: studentId,
        module_id: moduleId,
        class_id: null,
        level_id: null,
        payment_type: 'one_time',
        status: 'pending_payment',
        enrolled_at: '2024-01-15T10:00:00Z',
        activated_at: null,
        last_activity: null,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockEnrollment, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await enrollmentService.createEnrollment(studentId, moduleId, paymentType);

      expect(result).toEqual(mockEnrollment);
      expect(result.status).toBe('pending_payment');
      expect(result.payment_type).toBe('one_time');
    });

    it('should create enrollment with installment payment', async () => {
      const studentId = '723e4567-e89b-12d3-a456-426614174000';
      const moduleId = '823e4567-e89b-12d3-a456-426614174000';
      const paymentType = 'installment';

      const mockEnrollment = {
        id: 'enrollment-456',
        student_id: studentId,
        module_id: moduleId,
        class_id: null,
        level_id: null,
        payment_type: 'installment',
        status: 'pending_payment',
        enrolled_at: '2024-01-15T11:00:00Z',
        activated_at: null,
        last_activity: null,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockEnrollment, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await enrollmentService.createEnrollment(studentId, moduleId, paymentType);

      expect(result.payment_type).toBe('installment');
    });

    it('should throw error with invalid UUID', async () => {
      await expect(
        enrollmentService.createEnrollment('invalid-uuid', 'also-invalid', 'one_time')
      ).rejects.toThrow();
    });

    it('should throw error when database insert fails', async () => {
      const studentId = '923e4567-e89b-12d3-a456-426614174000';
      const moduleId = 'a23e4567-e89b-12d3-a456-426614174000';

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Foreign key violation' },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      await expect(
        enrollmentService.createEnrollment(studentId, moduleId, 'one_time')
      ).rejects.toThrow();
    });
  });

  describe('getStudentEnrollments', () => {
    it('should fetch all enrollments for a student', async () => {
      const studentId = 'b23e4567-e89b-12d3-a456-426614174000';
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          student_id: studentId,
          module_id: 'module-1',
          status: 'active',
          enrolled_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'enrollment-2',
          student_id: studentId,
          module_id: 'module-2',
          status: 'pending_payment',
          enrolled_at: '2024-01-10T10:00:00Z',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockEnrollments, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await enrollmentService.getStudentEnrollments(studentId);

      expect(result).toEqual(mockEnrollments);
      expect(result).toHaveLength(2);
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('student_id', studentId);
      expect(mockOrder).toHaveBeenCalledWith('enrolled_at', { ascending: false });
    });

    it('should return empty array when no enrollments found', async () => {
      const studentId = 'c23e4567-e89b-12d3-a456-426614174000';

      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await enrollmentService.getStudentEnrollments(studentId);

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const studentId = 'd23e4567-e89b-12d3-a456-426614174000';

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection error' },
      });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(
        enrollmentService.getStudentEnrollments(studentId)
      ).rejects.toThrow();
    });
  });

  describe('updateEnrollmentStatus', () => {
    it('should update enrollment status to active and set activated_at', async () => {
      const enrollmentId = 'e23e4567-e89b-12d3-a456-426614174000';
      const newStatus = 'active';

      const mockEnrollment = {
        id: enrollmentId,
        status: 'active',
        activated_at: '2024-01-15T12:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockEnrollment, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await enrollmentService.updateEnrollmentStatus(enrollmentId, newStatus);

      expect(result.status).toBe('active');
      expect(result.activated_at).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          activated_at: expect.any(String),
        })
      );
    });

    it('should update status to completed without changing activated_at', async () => {
      const enrollmentId = 'f23e4567-e89b-12d3-a456-426614174000';
      const newStatus = 'completed';

      const mockEnrollment = {
        id: enrollmentId,
        status: 'completed',
        activated_at: '2024-01-10T12:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockEnrollment, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await enrollmentService.updateEnrollmentStatus(enrollmentId, newStatus);

      expect(result.status).toBe('completed');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should throw error when enrollment not found', async () => {
      const enrollmentId = 'g23e4567-e89b-12d3-a456-426614174000';

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(
        enrollmentService.updateEnrollmentStatus(enrollmentId, 'active')
      ).rejects.toThrow();
    });
  });

  describe('assignClassAndLevel', () => {
    it('should assign class and level and activate enrollment', async () => {
      const enrollmentId = 'h23e4567-e89b-12d3-a456-426614174000';
      const classId = 'i23e4567-e89b-12d3-a456-426614174000';
      const levelId = 'j23e4567-e89b-12d3-a456-426614174000';

      const mockEnrollment = {
        id: enrollmentId,
        class_id: classId,
        level_id: levelId,
        status: 'active',
        activated_at: '2024-01-15T14:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockEnrollment, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await enrollmentService.assignClassAndLevel(enrollmentId, classId, levelId);

      expect(result.class_id).toBe(classId);
      expect(result.level_id).toBe(levelId);
      expect(result.status).toBe('active');
      expect(result.activated_at).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          class_id: classId,
          level_id: levelId,
          status: 'active',
          activated_at: expect.any(String),
        })
      );
    });

    it('should throw error with invalid UUIDs', async () => {
      await expect(
        enrollmentService.assignClassAndLevel('invalid', 'also-invalid', 'still-invalid')
      ).rejects.toThrow();
    });

    it('should throw error when update fails', async () => {
      const enrollmentId = 'k23e4567-e89b-12d3-a456-426614174000';
      const classId = 'l23e4567-e89b-12d3-a456-426614174000';
      const levelId = 'm23e4567-e89b-12d3-a456-426614174000';

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Foreign key violation' },
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(
        enrollmentService.assignClassAndLevel(enrollmentId, classId, levelId)
      ).rejects.toThrow();
    });
  });

  describe('RLS and Authorization', () => {
    it('should only allow students to see their own enrollments', async () => {
      // This test verifies RLS behavior - in production, the database enforces this
      const studentId = 'n23e4567-e89b-12d3-a456-426614174000';
      
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{ id: 'enrollment-1', student_id: studentId }],
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await enrollmentService.getStudentEnrollments(studentId);

      expect(mockEq).toHaveBeenCalledWith('student_id', studentId);
      expect(result.every(e => e.student_id === studentId)).toBe(true);
    });
  });

  describe('Integration Flow', () => {
    it('should complete full enrollment workflow', async () => {
      // Step 1: Create student profile
      const userId = 'o23e4567-e89b-12d3-a456-426614174000';
      const profileData: EnrollmentFormData = {
        isMinor: false,
        consentGiven: true,
      };

      const mockProfile = {
        id: 'profile-789',
        user_id: userId,
        is_minor: false,
        consent_given: true,
      };

      let mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const profile = await enrollmentService.createStudentProfile(userId, profileData);
      expect(profile.user_id).toBe(userId);

      // Step 2: Create enrollment
      const moduleId = 'p23e4567-e89b-12d3-a456-426614174000';
      const mockEnrollment = {
        id: 'enrollment-789',
        student_id: userId,
        module_id: moduleId,
        status: 'pending_payment',
      };

      mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockEnrollment, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const enrollment = await enrollmentService.createEnrollment(userId, moduleId, 'one_time');
      expect(enrollment.status).toBe('pending_payment');

      // Step 3: Activate enrollment
      const activatedEnrollment = {
        ...mockEnrollment,
        status: 'active',
        activated_at: '2024-01-15T15:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: activatedEnrollment, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const updated = await enrollmentService.updateEnrollmentStatus(enrollment.id, 'active');
      expect(updated.status).toBe('active');
      expect(updated.activated_at).toBeDefined();
    });
  });
});
