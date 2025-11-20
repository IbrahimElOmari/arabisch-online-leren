import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Enrollment, StudentProfile, EnrollmentFormData } from '@/types/modules';
import { z } from 'zod';

// Validation schemas
export const enrollmentFormSchema = z.object({
  dateOfBirth: z.string().optional(),
  isMinor: z.boolean(),
  parentName: z.string().max(255).optional(),
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().max(50).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
  consentGiven: z.boolean(),
});

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  moduleId: z.string().uuid('Invalid module ID'),
  paymentType: z.enum(['one_time', 'installment']),
});

export const assignClassLevelSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  classId: z.string().uuid('Invalid class ID'),
  levelId: z.string().uuid('Invalid level ID'),
});

export const enrollmentService = {
  async createStudentProfile(userId: string, formData: EnrollmentFormData): Promise<StudentProfile> {
    try {
      // Validate inputs
      enrollmentFormSchema.parse(formData);
      z.string().uuid().parse(userId);
      const profile = {
        user_id: userId,
        date_of_birth: formData.dateOfBirth || null,
        is_minor: formData.isMinor,
        parent_name: formData.parentName || null,
        parent_email: formData.parentEmail || null,
        parent_phone: formData.parentPhone || null,
        emergency_contact: formData.emergencyContact as any, // JSONB field
        consent_given: formData.consentGiven
      };

      const { data, error } = await supabase
        .from('student_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) throw error;
      logger.info('Student profile created', { userId });
      
      return {
        ...data,
        is_minor: data.is_minor ?? false,
        emergency_contact: data.emergency_contact as any
      } as StudentProfile;
    } catch (error) {
      logger.error('Failed to create student profile', { userId }, error as Error);
      throw error;
    }
  },

  async createEnrollment(studentId: string, moduleId: string, paymentType: 'one_time' | 'installment'): Promise<Enrollment> {
    try {
      // Validate inputs
      const validated = createEnrollmentSchema.parse({ studentId, moduleId, paymentType });
      const enrollment: Omit<Enrollment, 'id' | 'enrolled_at' | 'activated_at' | 'last_activity'> = {
        student_id: validated.studentId,
        module_id: validated.moduleId,
        class_id: null,
        level_id: null,
        payment_type: paymentType,
        status: 'pending_payment'
      };

      const { data, error } = await supabase
        .from('enrollments')
        .insert(enrollment)
        .select()
        .single();

      if (error) throw error;
      logger.info('Enrollment created', { enrollmentId: data.id, studentId, moduleId });
      return data;
    } catch (error) {
      logger.error('Failed to create enrollment', { studentId, moduleId }, error as Error);
      throw error;
    }
  },

  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch enrollments', { studentId }, error as Error);
      throw error;
    }
  },

  async updateEnrollmentStatus(enrollmentId: string, status: Enrollment['status']): Promise<Enrollment> {
    try {
      const updates: Partial<Enrollment> = { status };
      
      if (status === 'active') {
        updates.activated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('enrollments')
        .update(updates)
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      logger.info('Enrollment status updated', { enrollmentId, status });
      return data;
    } catch (error) {
      logger.error('Failed to update enrollment status', { enrollmentId, status }, error as Error);
      throw error;
    }
  },

  async assignClassAndLevel(enrollmentId: string, classId: string, levelId: string): Promise<Enrollment> {
    try {
      // Validate inputs
      const validated = assignClassLevelSchema.parse({ enrollmentId, classId, levelId });
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          class_id: validated.classId,
          level_id: validated.levelId,
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .eq('id', validated.enrollmentId)
        .select()
        .single();

      if (error) throw error;
      logger.info('Class and level assigned', { enrollmentId: validated.enrollmentId, classId: validated.classId, levelId: validated.levelId });
      return data;
    } catch (error) {
      logger.error('Failed to assign class and level', { enrollmentId }, error as Error);
      throw error;
    }
  }
};
