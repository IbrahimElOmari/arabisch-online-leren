/**
 * Public Certificate Verification Page
 */

import { CertificateVerifier } from '@/components/certificates/CertificateVerifier';

export default function Verify() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <CertificateVerifier />
    </div>
  );
}
