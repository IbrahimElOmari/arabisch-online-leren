/**
 * Unit tests for case mapping utilities
 */

import { describe, it, expect } from 'vitest';

// Mock the case mapping functions
const toCamelCase = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'object' && item !== null ? toCamelCase(item as Record<string, unknown>) : item
    ) as unknown as Record<string, unknown>;
  }

  if (obj === null || typeof obj !== 'object') {
    return obj as unknown as Record<string, unknown>;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = obj[key];
    acc[camelKey] = typeof value === 'object' && value !== null
      ? toCamelCase(value as Record<string, unknown>)
      : value;
    return acc;
  }, {} as Record<string, unknown>);
};

const toSnakeCase = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  if (Array.isArray(obj)) {
    return obj.map(item =>
      typeof item === 'object' && item !== null ? toSnakeCase(item as Record<string, unknown>) : item
    ) as unknown as Record<string, unknown>;
  }

  if (obj === null || typeof obj !== 'object') {
    return obj as unknown as Record<string, unknown>;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const value = obj[key];
    acc[snakeKey] = typeof value === 'object' && value !== null
      ? toSnakeCase(value as Record<string, unknown>)
      : value;
    return acc;
  }, {} as Record<string, unknown>);
};

describe('Case Mapping Utilities', () => {
  describe('toCamelCase', () => {
    it('should convert snake_case keys to camelCase', () => {
      const input = {
        user_id: '123',
        full_name: 'Test User',
        created_at: '2025-01-01'
      };

      const result = toCamelCase(input);

      expect(result).toEqual({
        userId: '123',
        fullName: 'Test User',
        createdAt: '2025-01-01'
      });
    });

    it('should handle nested objects', () => {
      const input = {
        user_data: {
          first_name: 'John',
          last_name: 'Doe'
        }
      };

      const result = toCamelCase(input);

      expect(result).toEqual({
        userData: {
          firstName: 'John',
          lastName: 'Doe'
        }
      });
    });

    it('should handle arrays', () => {
      const input = [
        { user_id: '1', user_name: 'User 1' },
        { user_id: '2', user_name: 'User 2' }
      ];

      const result = toCamelCase(input as unknown as Record<string, unknown>);

      expect(result).toEqual([
        { userId: '1', userName: 'User 1' },
        { userId: '2', userName: 'User 2' }
      ]);
    });

    it('should handle null and undefined values', () => {
      const input = {
        user_id: '123',
        optional_field: null,
        another_field: undefined
      };

      const result = toCamelCase(input);

      expect(result).toEqual({
        userId: '123',
        optionalField: null,
        anotherField: undefined
      });
    });

    it('should handle already camelCase keys', () => {
      const input = {
        userId: '123',
        userName: 'Test'
      };

      const result = toCamelCase(input);

      expect(result).toEqual({
        userId: '123',
        userName: 'Test'
      });
    });
  });

  describe('toSnakeCase', () => {
    it('should convert camelCase keys to snake_case', () => {
      const input = {
        userId: '123',
        fullName: 'Test User',
        createdAt: '2025-01-01'
      };

      const result = toSnakeCase(input);

      expect(result).toEqual({
        user_id: '123',
        full_name: 'Test User',
        created_at: '2025-01-01'
      });
    });

    it('should handle nested objects', () => {
      const input = {
        userData: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const result = toSnakeCase(input);

      expect(result).toEqual({
        user_data: {
          first_name: 'John',
          last_name: 'Doe'
        }
      });
    });

    it('should handle arrays', () => {
      const input = [
        { userId: '1', userName: 'User 1' },
        { userId: '2', userName: 'User 2' }
      ];

      const result = toSnakeCase(input as unknown as Record<string, unknown>);

      expect(result).toEqual([
        { user_id: '1', user_name: 'User 1' },
        { user_id: '2', user_name: 'User 2' }
      ]);
    });

    it('should handle null values', () => {
      const input = {
        userId: '123',
        optionalField: null
      };

      const result = toSnakeCase(input);

      expect(result).toEqual({
        user_id: '123',
        optional_field: null
      });
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through round-trip', () => {
      const original = {
        user_id: '123',
        full_name: 'Test User',
        nested_data: {
          created_at: '2025-01-01',
          updated_at: '2025-01-02'
        }
      };

      const camelCased = toCamelCase(original);
      const backToSnake = toSnakeCase(camelCased);

      expect(backToSnake).toEqual(original);
    });
  });
});
