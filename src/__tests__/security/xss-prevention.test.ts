import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('XSS Prevention Tests', () => {
  it('should sanitize malicious script tags', () => {
    const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>';
    const sanitized = DOMPurify.sanitize(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Safe content');
  });

  it('should remove event handlers', () => {
    const maliciousInput = '<img src="x" onerror="alert(\'XSS\')">';
    const sanitized = DOMPurify.sanitize(maliciousInput);
    
    expect(sanitized).not.toContain('onerror');
  });

  it('should preserve safe HTML', () => {
    const safeInput = '<p>This is <strong>safe</strong> content</p>';
    const sanitized = DOMPurify.sanitize(safeInput);
    
    expect(sanitized).toBe(safeInput);
  });

  it('should remove javascript: protocols', () => {
    const maliciousInput = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const sanitized = DOMPurify.sanitize(maliciousInput);
    
    expect(sanitized).not.toContain('javascript:');
  });
});
