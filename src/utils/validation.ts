// Input validation and sanitization utilities

/**
 * @deprecated Use Zod schemas from src/lib/schemas.ts and DOMPurify for HTML sanitization instead.
 * This function is kept for backward compatibility but should not be used in new code.
 * 
 * For email/text input: Use Zod's .trim() and .email() validators
 * For HTML content: Use DOMPurify.sanitize()
 * 
 * @see src/lib/schemas.ts for Zod schema examples
 */
export const sanitizeInput = (input: string): string => {
  if (import.meta.env.DEV) {
    console.warn(
      '[DEPRECATED] sanitizeInput() is deprecated. Use Zod schemas from src/lib/schemas.ts instead.'
    );
  }
  // Enhanced XSS protection
  return input
    .replace(/[<>\"'&]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Wachtwoord moet minimaal 12 karakters lang zijn');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één hoofdletter bevatten');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één kleine letter bevatten');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één cijfer bevatten');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één speciaal teken bevatten');
  }
  
  // Check for common weak patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Wachtwoord mag niet meer dan 2 opeenvolgende identieke karakters bevatten');
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    errors.push('Wachtwoord mag geen veelvoorkomende patronen bevatten');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateTextLength = (text: string, maxLength: number): boolean => {
  return text.trim().length <= maxLength;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

// Enhanced security validations
export const validateIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

export const validateUserAgent = (userAgent: string): boolean => {
  // Basic user agent validation to prevent malicious strings
  return userAgent.length <= 500 && !/[<>]/.test(userAgent);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateCSRFToken = (token: string): boolean => {
  // CSRF token should be a random string of at least 32 characters
  return token.length >= 32 && /^[a-zA-Z0-9+/=]+$/.test(token);
};

export const sanitizeForLog = (data: any): any => {
  // Remove sensitive information from logs
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'session'];
  
  if (typeof data === 'string') {
    return data.substring(0, 1000); // Limit log length
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeForLog(sanitized[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};