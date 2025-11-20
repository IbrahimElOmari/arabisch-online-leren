/**
 * Certificate Service - F5 Implementation
 * Handles certificate generation, signing, and verification
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  IssuedCertificate, 
  CertificateTemplate
} from '@/types/certificates';

/**
 * Generate HMAC signature for certificate integrity
 */
async function generateSignature(certificateData: Record<string, any>): Promise<string> {
  const data = JSON.stringify(certificateData);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Use Web Crypto API for HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(import.meta.env.VITE_CERTIFICATE_SECRET || 'default-secret-key'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if student meets completion criteria
 */
export async function checkCompletionCriteria(
  studentId: string,
  niveauId?: string,
  moduleId?: string
): Promise<{ eligible: boolean; progress: number; missingCriteria: string[] }> {
  const { data: criteria, error } = await supabase
    .from('completion_criteria')
    .select('*')
    .match({
      niveau_id: niveauId ?? null,
      module_id: moduleId ?? null
    });

  if (error || !criteria?.length) {
    return { eligible: false, progress: 0, missingCriteria: ['No criteria defined'] };
  }

  const missingCriteria: string[] = [];
  let totalWeight = 0;
  let achievedWeight = 0;

  for (const criterion of criteria) {
    totalWeight += criterion.weight || 1;
    const config = criterion.criteria_config as Record<string, any> | null;

    switch (criterion.criteria_type) {
      case 'assessment': {
        // Check if minimum score achieved
        const minScore = config?.min_score || 70;
        const { data: answers } = await supabase
          .from('antwoorden')
          .select('punten')
          .eq('student_id', studentId);
        
        const avgScore = answers?.length 
          ? answers.reduce((sum, a) => sum + (a.punten || 0), 0) / answers.length 
          : 0;

        if (avgScore >= minScore) {
          achievedWeight += criterion.weight || 1;
        } else {
          missingCriteria.push(`Assessment score ${avgScore.toFixed(0)}% < ${minScore}%`);
        }
        break;
      }

      case 'participation': {
        // Check attendance rate
        const minRate = config?.min_attendance_rate || 80;
        const { data: attendance } = await supabase
          .from('aanwezigheid')
          .select('status')
          .eq('student_id', studentId);

        const attendanceRate = attendance?.length
          ? (attendance.filter(a => a.status === 'aanwezig').length / attendance.length) * 100
          : 0;

        if (attendanceRate >= minRate) {
          achievedWeight += criterion.weight || 1;
        } else {
          missingCriteria.push(`Attendance ${attendanceRate.toFixed(0)}% < ${minRate}%`);
        }
        break;
      }

      case 'time': {
        // Check total study time
        const minHours = config?.min_hours || 20;
        const { data: sessions } = await supabase
          .from('practice_sessions')
          .select('started_at, ended_at')
          .eq('student_id', studentId);

        const totalHours = sessions?.reduce((sum, s) => {
          if (!s.ended_at || !s.started_at) return sum;
          const diff = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
          return sum + diff / (1000 * 60 * 60);
        }, 0) || 0;

        if (totalHours >= minHours) {
          achievedWeight += criterion.weight || 1;
        } else {
          missingCriteria.push(`Study time ${totalHours.toFixed(1)}h < ${minHours}h`);
        }
        break;
      }

      case 'custom': {
        // Custom criteria evaluation
        if (config?.auto_pass) {
          achievedWeight += criterion.weight || 1;
        } else {
          missingCriteria.push(config?.description || 'Custom criteria');
        }
        break;
      }
    }
  }

  const progress = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;
  const eligible = progress >= 100;

  return { eligible, progress, missingCriteria };
}

/**
 * Generate certificate for student
 */
export async function generateCertificate(params: {
  studentId: string;
  niveauId?: string;
  moduleId?: string;
  templateId?: string;
  issuedBy: string;
}): Promise<IssuedCertificate> {
  const { studentId, niveauId, moduleId, templateId, issuedBy } = params;

  // Check eligibility
  const { eligible, missingCriteria } = await checkCompletionCriteria(
    studentId,
    niveauId,
    moduleId
  );

  if (!eligible) {
    throw new Error(`Student not eligible: ${missingCriteria.join(', ')}`);
  }

  // Get student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single();

  if (!profile) {
    throw new Error('Student profile not found');
  }

  // Get template or use default
  let template: CertificateTemplate | null = null;
  if (templateId) {
    const { data } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    template = data as CertificateTemplate | null;
  }

  // Prepare certificate data
  const certificateId = crypto.randomUUID();
  const certificateData = {
    student_name: profile.full_name || profile.email,
    student_email: profile.email,
    issue_date: new Date().toISOString(),
    niveau_id: niveauId,
    module_id: moduleId,
    template_design: (template?.template_design as Record<string, any>) || {
      background: 'default',
      border: 'elegant',
      logo_position: 'top-center'
    }
  };

  // Generate signature
  const signatureHash = await generateSignature(certificateData);
  const verificationUrl = `${window.location.origin}/verify/${certificateId}`;

  // Insert into database
  const { data: certificate, error } = await supabase
    .from('issued_certificates')
    .insert({
      certificate_id: certificateId,
      student_id: studentId,
      niveau_id: niveauId || null,
      module_id: moduleId || null,
      template_id: templateId || null,
      certificate_data: certificateData,
      signature_hash: signatureHash,
      verification_url: verificationUrl,
      issued_by: issuedBy,
      pdf_url: null, // Generated later by edge function
      qr_code_url: null // Generated later
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to issue certificate: ${error.message}`);
  }

  return certificate as IssuedCertificate;
}

/**
 * Verify certificate authenticity
 */
export async function verifyCertificate(
  certificateId: string
): Promise<{ valid: boolean; certificate?: IssuedCertificate; reason?: string }> {
  const { data: certificate, error } = await supabase
    .from('issued_certificates')
    .select('*')
    .eq('certificate_id', certificateId)
    .single();

  if (error || !certificate) {
    return { valid: false, reason: 'Certificate not found' };
  }

  if (certificate.is_revoked) {
    return { 
      valid: false, 
      certificate: certificate as IssuedCertificate,
      reason: certificate.revoked_reason || 'Certificate revoked' 
    };
  }

  // Verify signature
  const expectedSignature = await generateSignature(
    certificate.certificate_data as Record<string, any>
  );
  if (expectedSignature !== certificate.signature_hash) {
    return { valid: false, reason: 'Invalid signature - certificate may be tampered' };
  }

  // Log verification
  await supabase.from('certificate_verifications').insert({
    certificate_id: certificateId,
    verification_method: 'url',
    verifier_ip: null // Will be set by edge function
  });

  return { valid: true, certificate: certificate as IssuedCertificate };
}

/**
 * Revoke certificate
 */
export async function revokeCertificate(
  certificateId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('issued_certificates')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason
    })
    .eq('certificate_id', certificateId);

  if (error) {
    throw new Error(`Failed to revoke certificate: ${error.message}`);
  }
}

/**
 * Get student certificates
 */
export async function getStudentCertificates(
  studentId: string
): Promise<IssuedCertificate[]> {
  const { data, error } = await supabase
    .from('issued_certificates')
    .select('*')
    .eq('student_id', studentId)
    .order('issued_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch certificates: ${error.message}`);
  }

  return data as IssuedCertificate[];
}
