/**
 * Type definitions for Certificates (F5)
 */

export interface CertificateTemplate {
  id: string;
  template_name: string;
  template_design: Record<string, any>;
  template_language: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CompletionCriteria {
  id: string;
  niveau_id: string | null;
  module_id: string | null;
  criteria_type: 'assessment' | 'participation' | 'time' | 'custom';
  criteria_config: Record<string, any>;
  weight: number;
  is_required: boolean;
}

export interface IssuedCertificate {
  id: string;
  certificate_id: string;
  student_id: string;
  niveau_id: string | null;
  module_id: string | null;
  template_id: string | null;
  certificate_data: Record<string, any>;
  issued_at: string;
  issued_by: string | null;
  pdf_url: string | null;
  verification_url: string | null;
  qr_code_url: string | null;
  signature_hash: string;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export interface CertificateVerification {
  id: string;
  certificate_id: string;
  verified_at: string;
  verifier_ip: string | null;
  verification_method: 'qr' | 'id_lookup' | 'url' | null;
}
