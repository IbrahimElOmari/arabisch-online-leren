import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchTeacherClasses, fetchClassStudents } from '@/services/teacherService';
import { queryKeys } from '@/lib/queryKeys';

export function useTeacherClasses() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  const { data: classes, isLoading, error } = useQuery({
    queryKey: queryKeys.teacherClasses(user?.id),
    queryFn: () => fetchTeacherClasses(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teacherClasses(user?.id) });
  };

  return {
    classes: classes || [],
    isLoading,
    error,
    refetch,
  };
}

export function useClassStudents(classId: string | undefined) {
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['classStudents', classId],
    queryFn: () => fetchClassStudents(classId!),
    enabled: !!classId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  return {
    students: students || [],
    isLoading,
    error,
  };
}
