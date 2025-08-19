
// Content security and sanitization utilities

export const sanitizeHTML = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/style\s*=/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!file) {
    return { valid: false, error: 'Geen bestand geselecteerd' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen afbeeldingsbestanden zijn toegestaan (JPEG, PNG, GIF, WebP)' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Bestand is te groot (max 10MB)' };
  }

  // Check file extension matches mime type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeTypeMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp']
  };
  
  const allowedExtensions = mimeTypeMap[file.type] || [];
  if (extension && !allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Bestandsextensie komt niet overeen met bestandstype' };
  }

  return { valid: true };
};

export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!file) {
    return { valid: false, error: 'Geen bestand geselecteerd' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen video bestanden (MP4, WebM, OGG, MOV) zijn toegestaan' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Video bestand is te groot (max 100MB)' };
  }

  return { valid: true };
};

export const validateDocumentFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!file) {
    return { valid: false, error: 'Geen bestand geselecteerd' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen PDF, Word, Excel en tekst bestanden zijn toegestaan' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Document is te groot (max 20MB)' };
  }

  return { valid: true };
};

export const generateCSP = (nonce?: string): string => {
  const nonceDirective = nonce ? `'nonce-${nonce}'` : '';
  
  return [
    "default-src 'self'",
    `script-src 'self' ${nonceDirective} https://js.supabase.co https://www.youtube.com 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
};

export const securityHeaders = (nonce?: string) => ({
  'Content-Security-Policy': generateCSP(nonce),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block'
});

export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const isValidURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
    .substring(0, 100);
};
