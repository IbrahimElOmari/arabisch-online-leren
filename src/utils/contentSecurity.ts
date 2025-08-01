// Content security and sanitization utilities

export const sanitizeHTML = (input: string): string => {
  // Basic HTML sanitization - removes script tags and dangerous attributes
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
    .trim();
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen afbeeldingsbestanden zijn toegestaan' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Bestand is te groot (max 10MB)' };
  }

  return { valid: true };
};

export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen video bestanden (MP4, WebM, OGG) zijn toegestaan' };
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
    'text/plain'
  ];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen PDF, Word en tekst bestanden zijn toegestaan' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Document is te groot (max 20MB)' };
  }

  return { valid: true };
};

export const generateCSP = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.supabase.co https://www.youtube.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};

export const securityHeaders = {
  'Content-Security-Policy': generateCSP(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};