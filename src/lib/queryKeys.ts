
// Centralized query keys voor consistentie en type safety
export const queryKeys = {
  // Auth related
  userProfile: (userId?: string) => ['user-profile', userId] as const,
  
  // Classes related
  userClasses: (userId?: string, role?: string) => ['user-classes', userId, role] as const,
  classDetails: (classId: string) => ['class-details', classId] as const,
  
  // Tasks and questions
  levelTasks: (levelId: string) => ['level-tasks', levelId] as const,
  levelQuestions: (levelId: string) => ['level-questions', levelId] as const,
  taskSubmissions: (taskId: string, userId?: string) => ['task-submissions', taskId, userId] as const,
  
  // Forum related
  forumStructure: (classId: string) => ['forum-structure', classId] as const,
  forumPosts: (topicId: string) => ['forum-posts', topicId] as const,
  
  // Health checks
  backendHealth: () => ['backend-health'] as const,
  
  // Teacher related
  teacherClasses: (teacherId?: string) => ['teacher-classes', teacherId] as const,
  classStudents: (classId: string) => ['class-students', classId] as const,
  studentProgress: (studentId: string) => ['student-progress', studentId] as const,
  studentStats: (studentId: string) => ['student-stats', studentId] as const,
  teacherNotes: (studentId: string) => ['teacher-notes', studentId] as const,
} as const;
