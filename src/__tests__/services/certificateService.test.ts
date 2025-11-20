/**
 * Certificate Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as certificateService from '@/services/certificateService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn()
        })),
        match: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

describe('CertificateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCompletionCriteria', () => {
    it('returns not eligible when no criteria exist', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          match: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await certificateService.checkCompletionCriteria('student-id');
      
      expect(result.eligible).toBe(false);
      expect(result.progress).toBe(0);
      expect(result.missingCriteria).toContain('No criteria defined');
    });

    it('calculates progress correctly for mixed criteria', async () => {
      const mockCriteria = [
        {
          criteria_type: 'assessment',
          weight: 1,
          criteria_config: { min_score: 70 }
        },
        {
          criteria_type: 'participation',
          weight: 1,
          criteria_config: { min_attendance_rate: 80 }
        }
      ];

      const mockFrom = vi.fn((table: string) => {
        if (table === 'completion_criteria') {
          return {
            select: vi.fn(() => ({
              match: vi.fn(() => Promise.resolve({ data: mockCriteria, error: null }))
            }))
          };
        }
        if (table === 'antwoorden') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ 
                data: [{ punten: 80 }, { punten: 90 }], 
                error: null 
              }))
            }))
          };
        }
        if (table === 'aanwezigheid') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ 
                data: [
                  { status: 'aanwezig' },
                  { status: 'aanwezig' },
                  { status: 'afwezig' }
                ], 
                error: null 
              }))
            }))
          };
        }
        return { select: vi.fn() };
      });
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await certificateService.checkCompletionCriteria('student-id');
      
      expect(result.progress).toBeGreaterThan(0);
    });
  });

  describe('generateCertificate', () => {
    it('throws error when student not eligible', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          match: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      await expect(
        certificateService.generateCertificate({
          studentId: 'student-id',
          issuedBy: 'admin-id'
        })
      ).rejects.toThrow('Student not eligible');
    });

    it('generates certificate with signature', async () => {
      // Mock eligible student
      const mockFrom = vi.fn((table: string) => {
        if (table === 'completion_criteria') {
          return {
            select: vi.fn(() => ({
              match: vi.fn(() => Promise.resolve({ 
                data: [{ 
                  criteria_type: 'custom', 
                  weight: 1,
                  criteria_config: { auto_pass: true } 
                }], 
                error: null 
              }))
            }))
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { 
                    id: 'student-id',
                    email: 'student@test.com',
                    full_name: 'Test Student'
                  },
                  error: null
                }))
              }))
            }))
          };
        }
        if (table === 'issued_certificates') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    certificate_id: 'cert-123',
                    student_id: 'student-id',
                    signature_hash: 'mock-hash'
                  },
                  error: null
                }))
              }))
            }))
          };
        }
        return { select: vi.fn() };
      });
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const certificate = await certificateService.generateCertificate({
        studentId: 'student-id',
        issuedBy: 'admin-id'
      });

      expect(certificate).toHaveProperty('certificate_id');
      expect(certificate).toHaveProperty('signature_hash');
    });
  });

  describe('verifyCertificate', () => {
    it('returns invalid for non-existent certificate', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } }))
          }))
        }))
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await certificateService.verifyCertificate('invalid-id');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Certificate not found');
    });

    it('returns invalid for revoked certificate', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                certificate_id: 'cert-123',
                is_revoked: true,
                revoked_reason: 'Duplicate issued'
              },
              error: null
            }))
          }))
        }))
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await certificateService.verifyCertificate('cert-123');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('revoked');
    });
  });

  describe('getStudentCertificates', () => {
    it('fetches all certificates for student', async () => {
      const mockCertificates = [
        { certificate_id: 'cert-1', student_id: 'student-id' },
        { certificate_id: 'cert-2', student_id: 'student-id' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockCertificates, error: null }))
          }))
        }))
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const certificates = await certificateService.getStudentCertificates('student-id');
      
      expect(certificates).toHaveLength(2);
      expect(certificates[0]).toHaveProperty('certificate_id');
    });
  });
});
