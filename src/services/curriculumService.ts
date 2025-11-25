import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// ============================================
// CURRICULUM LEVELS (6 Niveaus)
// ============================================

export interface CurriculumLevel {
  id: number;
  key: string;
  nl: string;
  en: string;
  ar: string;
  description_nl: string;
  description_en: string;
  cefr: string;
  estimated_hours: number;
  completion_criteria: {
    theory_score: number;
    practice_score: number;
    consistency_weeks: number;
  };
}

export const CURRICULUM_LEVELS: CurriculumLevel[] = [
  {
    id: 1,
    key: 'basis',
    nl: 'Basis',
    en: 'Beginner',
    ar: 'المبتدئ',
    description_nl: 'Alfabet, basisklanken, eenvoudige dagelijkse zinnen',
    description_en: 'Alphabet, basic sounds, simple daily sentences',
    cefr: 'A1',
    estimated_hours: 50,
    completion_criteria: {
      theory_score: 80,
      practice_score: 75,
      consistency_weeks: 3,
    },
  },
  {
    id: 2,
    key: 'beginner',
    nl: 'Beginner',
    en: 'Elementary',
    ar: 'الأساسي',
    description_nl: 'Alledaagse zinnen, korte teksten, basis interpunctie',
    description_en: 'Common phrases, short texts, basic punctuation',
    cefr: 'A2',
    estimated_hours: 100,
    completion_criteria: {
      theory_score: 80,
      practice_score: 75,
      consistency_weeks: 3,
    },
  },
  {
    id: 3,
    key: 'gemiddeld',
    nl: 'Gemiddeld',
    en: 'Intermediate',
    ar: 'المتوسط',
    description_nl: 'Vertrouwde onderwerpen, meningen, complexe spelling',
    description_en: 'Familiar topics, opinions, complex spelling',
    cefr: 'B1',
    estimated_hours: 150,
    completion_criteria: {
      theory_score: 80,
      practice_score: 75,
      consistency_weeks: 3,
    },
  },
  {
    id: 4,
    key: 'gevorderd',
    nl: 'Gevorderd',
    en: 'Advanced',
    ar: 'المتقدم',
    description_nl: 'Diepgaande analyse, discussies, uitzonderingsregels',
    description_en: 'In-depth analysis, discussions, exception cases',
    cefr: 'B2',
    estimated_hours: 200,
    completion_criteria: {
      theory_score: 80,
      practice_score: 75,
      consistency_weeks: 3,
    },
  },
  {
    id: 5,
    key: 'professioneel',
    nl: 'Professioneel',
    en: 'Professional',
    ar: 'الاحترافي',
    description_nl: 'Literatuur, historische teksten, academisch schrijven',
    description_en: 'Literature, historical texts, academic writing',
    cefr: 'C1',
    estimated_hours: 300,
    completion_criteria: {
      theory_score: 85,
      practice_score: 80,
      consistency_weeks: 4,
    },
  },
  {
    id: 6,
    key: 'specialist',
    nl: 'Specialist',
    en: 'Specialist',
    ar: 'المتخصص',
    description_nl: 'Literaire kritiek, thesis, complete taalbeheersing',
    description_en: 'Literary criticism, thesis, complete mastery',
    cefr: 'C2',
    estimated_hours: 400,
    completion_criteria: {
      theory_score: 90,
      practice_score: 85,
      consistency_weeks: 4,
    },
  },
];

// ============================================
// LEARNING PILLARS (Vier Pijlers)
// ============================================

export interface LearningPillar {
  key: string;
  nl: string;
  en: string;
  ar: string;
  description_nl: string;
  description_en: string;
}

export const LEARNING_PILLARS: LearningPillar[] = [
  {
    key: 'reading',
    nl: 'Lezen',
    en: 'Reading',
    ar: 'قراءة',
    description_nl: 'Begrijpend lezen van teksten',
    description_en: 'Reading comprehension',
  },
  {
    key: 'writing',
    nl: 'Schrijven',
    en: 'Writing',
    ar: 'كتابة',
    description_nl: 'Correcte spelling en compositie',
    description_en: 'Correct spelling and composition',
  },
  {
    key: 'morphology',
    nl: 'Vormleer',
    en: 'Morphology',
    ar: 'الصرف',
    description_nl: 'Grammaticale structuren en patronen',
    description_en: 'Grammatical structures and patterns',
  },
  {
    key: 'grammar',
    nl: 'Grammatica',
    en: 'Grammar',
    ar: 'النحو',
    description_nl: 'Zinsbouw en taalregels',
    description_en: 'Sentence structure and language rules',
  },
];

// ============================================
// CONTENT MAPPING
// ============================================

export interface ContentMapping {
  content_id: string;
  content_type: 'lesson' | 'task' | 'exercise';
  niveau_id: string;
  pillar: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_minutes: number;
}

// Validation schemas
export const contentMappingSchema = z.object({
  content_id: z.string().uuid(),
  content_type: z.enum(['lesson', 'task', 'exercise']),
  niveau_id: z.string().uuid(),
  pillar: z.enum(['reading', 'writing', 'morphology', 'grammar']),
  topics: z.array(z.string()).min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimated_minutes: z.number().min(1).max(480),
});

export const studentProgressSchema = z.object({
  student_id: z.string().uuid(),
  module_id: z.string().uuid(),
  niveau_id: z.string().uuid(),
});

// ============================================
// CURRICULUM SERVICE
// ============================================

export class CurriculumService {
  /**
   * Get curriculum level by ID or key
   */
  static getLevel(identifier: number | string): CurriculumLevel | undefined {
    if (typeof identifier === 'number') {
      return CURRICULUM_LEVELS.find(l => l.id === identifier);
    }
    return CURRICULUM_LEVELS.find(l => l.key === identifier);
  }

  /**
   * Get all curriculum levels
   */
  static getAllLevels(): CurriculumLevel[] {
    return CURRICULUM_LEVELS;
  }

  /**
   * Get next level after current
   */
  static getNextLevel(currentLevelId: number): CurriculumLevel | null {
    const nextLevel = CURRICULUM_LEVELS.find(l => l.id === currentLevelId + 1);
    return nextLevel || null;
  }

  /**
   * Check if student has completed level requirements
   */
  static async checkLevelCompletion(
    studentId: string,
    moduleId: string,
    niveauId: string
  ): Promise<{
    completed: boolean;
    theory_score: number;
    practice_score: number;
    consistency_weeks: number;
    missing: string[];
  }> {
    const validated = studentProgressSchema.parse({ student_id: studentId, module_id: moduleId, niveau_id: niveauId });

    // Get niveau details from database
    const { data: niveau } = await supabase
      .from('niveaus')
      .select('*')
      .eq('id', validated.niveau_id)
      .single();

    if (!niveau) throw new Error('Niveau not found');

    // Get curriculum level requirements
    const curriculumLevel = this.getLevel(niveau.niveau_nummer);
    if (!curriculumLevel) throw new Error('Curriculum level not found');

    // Fetch student analytics
    const { data: analytics } = await supabase
      .from('learning_analytics')
      .select('*')
      .eq('student_id', validated.student_id)
      .eq('module_id', validated.module_id)
      .eq('niveau_id', validated.niveau_id)
      .single();

    const theoryScore = analytics?.accuracy_rate ? analytics.accuracy_rate * 100 : 0;
    const practiceScore = analytics?.accuracy_rate ? analytics.accuracy_rate * 100 : 0;

    // Calculate consistency (weeks with activity)
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('started_at')
      .eq('student_id', validated.student_id)
      .order('started_at', { ascending: false })
      .limit(50);

    const consistencyWeeks = this.calculateConsistencyWeeks(sessions || []);

    // Check requirements
    const criteria = curriculumLevel.completion_criteria;
    const missing: string[] = [];

    if (theoryScore < criteria.theory_score) {
      missing.push(`Theory score (${theoryScore.toFixed(1)}% < ${criteria.theory_score}%)`);
    }
    if (practiceScore < criteria.practice_score) {
      missing.push(`Practice score (${practiceScore.toFixed(1)}% < ${criteria.practice_score}%)`);
    }
    if (consistencyWeeks < criteria.consistency_weeks) {
      missing.push(`Consistency (${consistencyWeeks} weeks < ${criteria.consistency_weeks} weeks)`);
    }

    return {
      completed: missing.length === 0,
      theory_score: theoryScore,
      practice_score: practiceScore,
      consistency_weeks: consistencyWeeks,
      missing,
    };
  }

  /**
   * Calculate number of consistent weeks (weeks with activity)
   */
  private static calculateConsistencyWeeks(sessions: Array<{ started_at: string | null }>): number {
    if (sessions.length === 0) return 0;

    // Group by week
    const weeks = new Set<string>();
    sessions.forEach(session => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      const weekKey = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
      weeks.add(weekKey);
    });

    return weeks.size;
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Map content to curriculum structure
   */
  static async mapContent(mapping: ContentMapping): Promise<void> {
    const validated = contentMappingSchema.parse(mapping);

    // Store mapping in content_library metadata
    const { error } = await supabase
      .from('content_library')
      .update({
        metadata: {
          curriculum_mapping: {
            niveau_id: validated.niveau_id,
            pillar: validated.pillar,
            topics: validated.topics,
            difficulty: validated.difficulty,
            estimated_minutes: validated.estimated_minutes,
          },
        },
      })
      .eq('id', validated.content_id);

    if (error) throw error;
  }

  /**
   * Get recommended content for student based on analytics
   */
  static async getRecommendedContent(
    studentId: string,
    moduleId: string,
    niveauId: string
  ): Promise<Array<{
    id: string;
    title: string;
    type: string;
    pillar: string;
    difficulty: string;
    reason: string;
  }>> {
    const validated = studentProgressSchema.parse({ student_id: studentId, module_id: moduleId, niveau_id: niveauId });

    // Get student analytics to identify weak areas
    const { data: analytics } = await supabase
      .from('learning_analytics')
      .select('*')
      .eq('student_id', validated.student_id)
      .eq('module_id', validated.module_id)
      .eq('niveau_id', validated.niveau_id)
      .single();

    const weakAreas = analytics?.weak_areas || [];
    const strongAreas = analytics?.strong_areas || [];
    const accuracyRate = analytics?.accuracy_rate || 0.5;

    // Determine difficulty
    let targetDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (accuracyRate < 0.7) targetDifficulty = 'easy';
    else if (accuracyRate >= 0.85) targetDifficulty = 'hard';

    // Fetch content from content_library
    const { data: content } = await supabase
      .from('content_library')
      .select('*')
      .eq('level_id', validated.niveau_id)
      .eq('status', 'published')
      .limit(20);

    const recommendations: Array<{
      id: string;
      title: string;
      type: string;
      pillar: string;
      difficulty: string;
      reason: string;
    }> = [];

    (content || []).forEach((item: any) => {
      const mapping = item.metadata?.curriculum_mapping;
      if (!mapping) return;

      let reason = '';

      // Prioritize weak areas
      if (weakAreas.some((area: string) => mapping.topics?.includes(area))) {
        reason = 'Focuses on your weak area';
      }
      // Appropriate difficulty
      else if (mapping.difficulty === targetDifficulty) {
        reason = 'Matches your current level';
      }
      // Avoid strong areas if we have weak areas to work on
      else if (strongAreas.some((area: string) => mapping.topics?.includes(area)) && weakAreas.length > 0) {
        return; // Skip
      }
      else {
        reason = 'Recommended for your niveau';
      }

      recommendations.push({
        id: item.id,
        title: item.title,
        type: item.content_type,
        pillar: mapping.pillar || 'general',
        difficulty: mapping.difficulty || 'medium',
        reason,
      });
    });

    // Sort by priority (weak areas first)
    recommendations.sort((a, b) => {
      const priorityA = a.reason.includes('weak') ? 3 : a.reason.includes('level') ? 2 : 1;
      const priorityB = b.reason.includes('weak') ? 3 : b.reason.includes('level') ? 2 : 1;
      return priorityB - priorityA;
    });

    return recommendations.slice(0, 10);
  }

  /**
   * Get student progress through curriculum
   */
  static async getStudentProgress(
    studentId: string,
    moduleId: string
  ): Promise<{
    current_niveau: CurriculumLevel;
    completion_percentage: number;
    pillars_progress: Array<{ pillar: string; percentage: number }>;
    next_niveau: CurriculumLevel | null;
  }> {
    // Get current enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('level_id')
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .eq('status', 'active')
      .single();

    if (!enrollment || !enrollment.level_id) throw new Error('No active enrollment found');

    // Get niveau details
    const { data: niveau } = await supabase
      .from('module_levels')
      .select('*')
      .eq('id', enrollment.level_id)
      .single();

    const niveauNummer = niveau?.sequence_order || 1;
    const currentNiveau = this.getLevel(niveauNummer);
    if (!currentNiveau) throw new Error('Curriculum level not found');

    // Check completion
    const completion = await this.checkLevelCompletion(
      studentId,
      moduleId,
      enrollment.level_id || ''
    );

    // Calculate overall completion percentage
    const completionPercentage = 
      (completion.theory_score * 0.4 +
       completion.practice_score * 0.4 +
       (completion.consistency_weeks / currentNiveau.completion_criteria.consistency_weeks) * 100 * 0.2);

    // Get progress per pillar
    const pillarsProgress = await Promise.all(
      LEARNING_PILLARS.map(async (pillar) => {
        if (!enrollment.level_id) {
          return { pillar: pillar.key, percentage: 0 };
        }
        
        // Count completed content per pillar
        const { count: total } = await supabase
          .from('content_library')
          .select('*', { count: 'exact', head: true })
          .eq('level_id', enrollment.level_id)
          .filter('metadata->>pillar', 'eq', pillar.key);

        // This is simplified - in a real implementation, you'd track individual content completion
        const completed = Math.floor((total || 0) * (completionPercentage / 100));

        return {
          pillar: pillar.key,
          percentage: total ? (completed / total) * 100 : 0,
        };
      })
    );

    return {
      current_niveau: currentNiveau,
      completion_percentage: completionPercentage,
      pillars_progress: pillarsProgress,
      next_niveau: this.getNextLevel(currentNiveau.id),
    };
  }
}
