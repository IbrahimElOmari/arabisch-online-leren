
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
} as const;
