import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeacherClasses, useClassStudents } from '../useTeacherClasses';
import * as teacherService from '@/services/teacherService';
import React from 'react';

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ user: { id: 'teacher-1' } })
}));

vi.mock('@/services/teacherService');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  return Wrapper;
};

describe('useTeacherClasses', () => {
  it('should fetch teacher classes', async () => {
    const mockClasses = [
      { id: '1', name: 'Class A', teacher_id: 'teacher-1' },
      { id: '2', name: 'Class B', teacher_id: 'teacher-1' }
    ];

    vi.mocked(teacherService.fetchTeacherClasses).mockResolvedValue(mockClasses as any);

    const { result } = renderHook(() => useTeacherClasses(), {
      wrapper: createWrapper(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.classes).toEqual(mockClasses);
    expect(teacherService.fetchTeacherClasses).toHaveBeenCalledWith('teacher-1');
  });

  it('should handle empty classes', async () => {
    vi.mocked(teacherService.fetchTeacherClasses).mockResolvedValue([]);

    const { result } = renderHook(() => useTeacherClasses(), {
      wrapper: createWrapper(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.classes).toEqual([]);
  });

  it('should handle errors', async () => {
    vi.mocked(teacherService.fetchTeacherClasses).mockRejectedValue(
      new Error('Fetch failed')
    );

    const { result } = renderHook(() => useTeacherClasses(), {
      wrapper: createWrapper(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.error).toBeTruthy();
  });
});

describe('useClassStudents', () => {
  it('should fetch class students', async () => {
    const mockStudents = [
      { id: '1', student_id: 'student-1', class_id: 'class-1' }
    ];

    vi.mocked(teacherService.fetchClassStudents).mockResolvedValue(mockStudents as any);

    const { result } = renderHook(() => useClassStudents('class-1'), {
      wrapper: createWrapper(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.students).toEqual(mockStudents);
    expect(teacherService.fetchClassStudents).toHaveBeenCalledWith('class-1');
  });

  it('should not fetch when classId is undefined', async () => {
    const { result } = renderHook(() => useClassStudents(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.students).toEqual([]);
    expect(teacherService.fetchClassStudents).not.toHaveBeenCalled();
  });
});
