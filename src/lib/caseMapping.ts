/**
 * Case Mapping Utilities
 * 
 * Automatische conversie tussen database snake_case en frontend camelCase.
 * Gebruik deze functies voor alle data die van/naar Supabase gaat.
 * 
 * @example
 * ```typescript
 * // Van database naar frontend
 * const frontendData = toCamelCase(supabaseData);
 * 
 * // Van frontend naar database
 * const dbData = toSnakeCase(frontendData);
 * ```
 */

// ==================== Type Definitions ====================

type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

type CamelCaseKeys<T> = T extends readonly unknown[]
  ? { [K in keyof T]: CamelCaseKeys<T[K]> }
  : T extends object
  ? { [K in keyof T as SnakeToCamel<K & string>]: CamelCaseKeys<T[K]> }
  : T;

type SnakeCaseKeys<T> = T extends readonly unknown[]
  ? { [K in keyof T]: SnakeCaseKeys<T[K]> }
  : T extends object
  ? { [K in keyof T as CamelToSnake<K & string>]: SnakeCaseKeys<T[K]> }
  : T;

// ==================== Conversion Functions ====================

/**
 * Convert a string from snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a string from camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Deep convert object keys from snake_case to camelCase
 * Used for converting database responses to frontend format
 */
export function toCamelCase<T>(obj: T): CamelCaseKeys<T> {
  if (obj === null || obj === undefined) {
    return obj as CamelCaseKeys<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as CamelCaseKeys<T>;
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = toCamelCase(value);
    }
    
    return result as CamelCaseKeys<T>;
  }

  return obj as CamelCaseKeys<T>;
}

/**
 * Deep convert object keys from camelCase to snake_case
 * Used for converting frontend data to database format
 */
export function toSnakeCase<T>(obj: T): SnakeCaseKeys<T> {
  if (obj === null || obj === undefined) {
    return obj as SnakeCaseKeys<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as SnakeCaseKeys<T>;
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = toSnakeCase(value);
    }
    
    return result as SnakeCaseKeys<T>;
  }

  return obj as SnakeCaseKeys<T>;
}

// ==================== Supabase Wrapper Functions ====================

/**
 * Wrapper for Supabase select that automatically converts response to camelCase
 * 
 * @example
 * ```typescript
 * const { data } = await supabase.from('enrollments').select('*');
 * const camelCaseData = mapFromDatabase(data);
 * ```
 */
export function mapFromDatabase<T>(data: T): CamelCaseKeys<T> {
  return toCamelCase(data);
}

/**
 * Wrapper for Supabase insert/update that automatically converts to snake_case
 * 
 * @example
 * ```typescript
 * const dbData = mapToDatabase({ firstName: 'John', lastName: 'Doe' });
 * await supabase.from('profiles').insert(dbData);
 * ```
 */
export function mapToDatabase<T>(data: T): SnakeCaseKeys<T> {
  return toSnakeCase(data);
}

// ==================== Field Mapping Registry ====================

/**
 * Common database field mappings for reference
 * Use this as documentation for field conversions
 */
export const FIELD_MAPPINGS = {
  // User & Auth
  userId: 'user_id',
  fullName: 'full_name',
  avatarUrl: 'avatar_url',
  parentEmail: 'parent_email',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // Enrollment
  moduleId: 'module_id',
  classId: 'class_id',
  levelId: 'level_id',
  studentId: 'student_id',
  paymentType: 'payment_type',
  enrolledAt: 'enrolled_at',
  activatedAt: 'activated_at',
  lastActivity: 'last_activity',
  
  // Content
  contentType: 'content_type',
  contentData: 'content_data',
  niveauId: 'niveau_id',
  isActive: 'is_active',
  
  // Forum
  authorId: 'author_id',
  postId: 'post_id',
  threadId: 'thread_id',
  parentPostId: 'parent_post_id',
  likesCount: 'likes_count',
  dislikesCount: 'dislikes_count',
  
  // Gamification
  totalPoints: 'total_points',
  xpPoints: 'xp_points',
  badgeId: 'badge_id',
  earnedAt: 'earned_at',
  
  // Admin
  teacherId: 'teacher_id',
  isCompleted: 'is_completed',
  completedAt: 'completed_at',
} as const;

// ==================== Type-safe Query Helpers ====================

/**
 * Create a type-safe column selector for Supabase queries
 * Converts camelCase field names to snake_case for the query
 */
export function selectColumns<T extends keyof typeof FIELD_MAPPINGS>(
  ...columns: T[]
): string {
  return columns.map((col) => FIELD_MAPPINGS[col]).join(', ');
}

/**
 * Create a typed response transformer for specific entities
 */
export function createEntityMapper<TDatabase, TFrontend>() {
  return {
    fromDatabase: (data: TDatabase): TFrontend => toCamelCase(data) as unknown as TFrontend,
    toDatabase: (data: TFrontend): TDatabase => toSnakeCase(data) as unknown as TDatabase,
  };
}

// ==================== Pre-built Entity Mappers ====================

// Example usage for common entities
export const enrollmentMapper = createEntityMapper<
  {
    id: string;
    student_id: string;
    module_id: string;
    class_id: string | null;
    level_id: string | null;
    payment_type: string;
    status: string;
    enrolled_at: string;
  },
  {
    id: string;
    studentId: string;
    moduleId: string;
    classId: string | null;
    levelId: string | null;
    paymentType: string;
    status: string;
    enrolledAt: string;
  }
>();

export const profileMapper = createEntityMapper<
  {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    parent_email: string | null;
    created_at: string;
    updated_at: string;
  },
  {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    parentEmail: string | null;
    createdAt: string;
    updatedAt: string;
  }
>();

export const forumPostMapper = createEntityMapper<
  {
    id: string;
    author_id: string;
    class_id: string;
    titel: string;
    inhoud: string;
    created_at: string;
    updated_at: string;
    likes_count: number | null;
  },
  {
    id: string;
    authorId: string;
    classId: string;
    titel: string;
    inhoud: string;
    createdAt: string;
    updatedAt: string;
    likesCount: number | null;
  }
>();
