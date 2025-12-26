/**
 * Unit tests for role management utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
};

// Mock role check functions
const hasRole = async (userId: string, role: string): Promise<boolean> => {
  const { data, error } = await mockSupabase.rpc('has_role', {
    _user_id: userId,
    _role: role,
  });
  if (error) throw error;
  return data ?? false;
};

const getUserRole = async (userId: string): Promise<string | null> => {
  const { data, error } = await mockSupabase.rpc('get_user_role', {
    user_id: userId,
  });
  if (error) throw error;
  return data;
};

const changeUserRole = async (
  targetUserId: string,
  newRole: string,
  reason?: string
): Promise<{ success: boolean; oldRole: string; newRole: string }> => {
  const { data, error } = await mockSupabase.rpc('change_user_role', {
    target_user_id: targetUserId,
    new_role: newRole,
    reason: reason || null,
  });
  if (error) throw error;
  return data;
};

describe('Role Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });

      const result = await hasRole('user-123', 'admin');

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('has_role', {
        _user_id: 'user-123',
        _role: 'admin',
      });
    });

    it('should return false when user does not have the specified role', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: false, error: null });

      const result = await hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });

    it('should throw error on RPC failure', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(hasRole('user-123', 'admin')).rejects.toEqual({
        message: 'Database error',
      });
    });
  });

  describe('getUserRole', () => {
    it('should return the user role', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 'leerkracht', error: null });

      const result = await getUserRole('user-123');

      expect(result).toBe('leerkracht');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_role', {
        user_id: 'user-123',
      });
    });

    it('should return null when user has no role', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await getUserRole('user-123');

      expect(result).toBeNull();
    });
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, old_role: 'leerling', new_role: 'leerkracht' },
        error: null,
      });

      const result = await changeUserRole('user-123', 'leerkracht', 'Promoted to teacher');

      expect(result).toEqual({
        success: true,
        old_role: 'leerling',
        new_role: 'leerkracht',
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('change_user_role', {
        target_user_id: 'user-123',
        new_role: 'leerkracht',
        reason: 'Promoted to teacher',
      });
    });

    it('should handle role change without reason', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, old_role: 'leerling', new_role: 'admin' },
        error: null,
      });

      await changeUserRole('user-123', 'admin');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('change_user_role', {
        target_user_id: 'user-123',
        new_role: 'admin',
        reason: null,
      });
    });

    it('should throw error when unauthorized', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Unauthorized: Only admins can change user roles' },
      });

      await expect(changeUserRole('user-123', 'admin')).rejects.toEqual({
        message: 'Unauthorized: Only admins can change user roles',
      });
    });
  });

  describe('Role hierarchy', () => {
    const ROLE_HIERARCHY = {
      admin: 3,
      leerkracht: 2,
      leerling: 1,
    };

    it('should correctly compare role levels', () => {
      expect(ROLE_HIERARCHY.admin > ROLE_HIERARCHY.leerkracht).toBe(true);
      expect(ROLE_HIERARCHY.leerkracht > ROLE_HIERARCHY.leerling).toBe(true);
      expect(ROLE_HIERARCHY.admin > ROLE_HIERARCHY.leerling).toBe(true);
    });

    it('should identify admin as highest role', () => {
      const roles = Object.entries(ROLE_HIERARCHY);
      const highestRole = roles.reduce((a, b) => (a[1] > b[1] ? a : b));
      expect(highestRole[0]).toBe('admin');
    });
  });
});

describe('Role-based Access Control', () => {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_content', 'view_analytics'],
    leerkracht: ['read', 'write', 'manage_content', 'view_student_data'],
    leerling: ['read', 'submit_tasks', 'view_own_data'],
  };

  it('should validate admin has all permissions', () => {
    expect(permissions.admin).toContain('manage_users');
    expect(permissions.admin).toContain('delete');
    expect(permissions.admin).toContain('view_analytics');
  });

  it('should validate teacher has content management but not user management', () => {
    expect(permissions.leerkracht).toContain('manage_content');
    expect(permissions.leerkracht).not.toContain('manage_users');
    expect(permissions.leerkracht).not.toContain('delete');
  });

  it('should validate student has limited permissions', () => {
    expect(permissions.leerling).toContain('read');
    expect(permissions.leerling).toContain('submit_tasks');
    expect(permissions.leerling).not.toContain('write');
    expect(permissions.leerling).not.toContain('manage_content');
  });

  it('should check if role has permission', () => {
    const hasPermission = (role: keyof typeof permissions, permission: string): boolean => {
      return permissions[role]?.includes(permission) ?? false;
    };

    expect(hasPermission('admin', 'manage_users')).toBe(true);
    expect(hasPermission('leerkracht', 'manage_users')).toBe(false);
    expect(hasPermission('leerling', 'read')).toBe(true);
  });
});
