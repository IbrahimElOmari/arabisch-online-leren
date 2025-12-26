/**
 * Supabase Helper Functions with Automatic Case Mapping
 * 
 * These helpers wrap Supabase operations and automatically handle
 * snake_case ↔ camelCase conversion.
 */

import { supabase } from '@/integrations/supabase/client';
import { toCamelCase, toSnakeCase } from './caseMapping';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

// ==================== Query Helpers ====================

/**
 * Fetch data from Supabase with automatic camelCase conversion
 * 
 * @example
 * ```typescript
 * const { data, error } = await fetchWithMapping('enrollments', {
 *   select: '*',
 *   filter: { student_id: userId },
 * });
 * // data is already in camelCase
 * ```
 */
export async function fetchWithMapping<T>(
  table: TableName,
  options: {
    select?: string;
    filter?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters (keep snake_case for database)
    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value as string | number | boolean) as typeof query;
        }
      }
    }

    // Apply ordering
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Execute query
    const result = options.single 
      ? await query.single()
      : await query;

    if (result.error) {
      return { data: null, error: result.error };
    }

    // Convert response to camelCase
    const mappedData = toCamelCase(result.data) as T;
    return { data: mappedData, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Insert data into Supabase with automatic snake_case conversion
 */
export async function insertWithMapping<T>(
  table: TableName,
  data: Record<string, unknown>,
  options: { select?: string } = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const snakeData = toSnakeCase(data);
    
    const query = supabase.from(table).insert(snakeData as never);
    
    const result = options.select
      ? await query.select(options.select)
      : await query;

    if (result.error) {
      return { data: null, error: result.error };
    }

    const mappedData = result.data ? toCamelCase(result.data) as T : null;
    return { data: mappedData, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update data in Supabase with automatic snake_case conversion
 */
export async function updateWithMapping<T>(
  table: TableName,
  data: Record<string, unknown>,
  filter: Record<string, unknown>,
  options: { select?: string } = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const snakeData = toSnakeCase(data);
    
    let query = supabase.from(table).update(snakeData as never);
    
    // Apply filters
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value as string | number | boolean) as typeof query;
      }
    }
    
    const result = options.select
      ? await query.select(options.select)
      : await query;

    if (result.error) {
      return { data: null, error: result.error };
    }

    const mappedData = result.data ? toCamelCase(result.data) as T : null;
    return { data: mappedData, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete data from Supabase
 */
export async function deleteWithMapping(
  table: TableName,
  filter: Record<string, unknown>
): Promise<{ error: Error | null }> {
  try {
    let query = supabase.from(table).delete();
    
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value as string | number | boolean) as typeof query;
      }
    }

    const result = await query;
    return { error: result.error };
  } catch (error) {
    return { error: error as Error };
  }
}

// ==================== Role Check Helpers ====================

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Check if current user has a specific role using has_role RPC
 */
export async function checkUserRole(role: AppRole): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: role,
  });
  
  if (error) {
    if (import.meta.env.DEV) {
      console.error('Role check failed:', error);
    }
    return false;
  }
  
  return data === true;
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<AppRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase.rpc('get_user_role', {
    user_id: user.id,
  });
  
  if (error) {
    if (import.meta.env.DEV) {
      console.error('Get role failed:', error);
    }
    return null;
  }
  
  return data as AppRole | null;
}

/**
 * Change user role (admin only)
 */
export async function changeUserRole(
  targetUserId: string,
  newRole: AppRole,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('change_user_role', {
    target_user_id: targetUserId,
    new_role: newRole,
    reason: reason,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}
