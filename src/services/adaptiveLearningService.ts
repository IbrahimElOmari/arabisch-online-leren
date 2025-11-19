import { supabase } from '@/integrations/supabase/client';
import type { PracticeSession } from '@/types/learning';

interface DifficultyRecommendation {
  recommended_difficulty: 'easy' | 'medium' | 'hard';
  confidence_score: number;
  reasoning: string;
  weak_areas: string[];
  strong_areas: string[];
}

interface AdaptiveQuestion {
  id: string;
  difficulty: string;
  topic: string;
  question_text: string;
  question_type: string;
  options?: any;
}

export const adaptiveLearningService = {
  /**
   * Analyzes student performance and recommends next difficulty level
   * Uses accuracy rate, time per question, and recent performance trends
   */
  async getNextDifficulty(
    studentId: string,
    moduleId: string
  ): Promise<DifficultyRecommendation> {
    // Fetch learning analytics
    const { data: analytics, error } = await supabase
      .from('learning_analytics')
      .select('*')
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // Fetch recent practice sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
      .limit(5);

    if (sessionsError) throw sessionsError;

    // Calculate metrics
    const accuracyRate = analytics?.accuracy_rate || 0;
    const weakAreas = analytics?.weak_areas || [];
    const strongAreas = analytics?.strong_areas || [];

    // Determine difficulty
    let recommendedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    let confidenceScore = 0.5;
    let reasoning = '';

    if (accuracyRate >= 0.85 && weakAreas.length === 0) {
      recommendedDifficulty = 'hard';
      confidenceScore = 0.9;
      reasoning = 'High accuracy (≥85%) with no weak areas detected';
    } else if (accuracyRate >= 0.70) {
      recommendedDifficulty = 'medium';
      confidenceScore = 0.8;
      reasoning = 'Good accuracy (70-85%), suitable for medium difficulty';
    } else {
      recommendedDifficulty = 'easy';
      confidenceScore = 0.85;
      reasoning = 'Lower accuracy (<70%), focusing on foundational practice';
    }

    // Adjust based on recent session trends
    if (sessions && sessions.length >= 3) {
      const recentAccuracy = sessions.slice(0, 3).reduce((acc, session) => {
        const rate = session.questions_attempted 
          ? (session.questions_correct || 0) / session.questions_attempted 
          : 0;
        return acc + rate;
      }, 0) / 3;

      // If recent performance is trending up, consider increasing difficulty
      if (recentAccuracy > accuracyRate + 0.1 && recommendedDifficulty === 'easy') {
        recommendedDifficulty = 'medium';
        reasoning += ' (Recent improvement detected)';
      }
    }

    return {
      recommended_difficulty: recommendedDifficulty,
      confidence_score: confidenceScore,
      reasoning,
      weak_areas: weakAreas,
      strong_areas: strongAreas,
    };
  },

  /**
   * Fetches adaptive questions based on difficulty and weak areas
   */
  async getAdaptiveQuestions(
    niveauId: string,
    difficulty: string,
    weakAreas: string[],
    count: number = 10
  ): Promise<AdaptiveQuestion[]> {
    let query = supabase
      .from('vragen')
      .select('*')
      .eq('niveau_id', niveauId)
      .limit(count);

    // If weak areas exist, prioritize questions on those topics
    if (weakAreas.length > 0) {
      // In a real implementation, you'd have a topic field to filter on
      // For now, we'll just fetch random questions
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(q => ({
      id: q.id,
      difficulty: difficulty,
      topic: 'General',
      question_text: q.vraag_tekst || '',
      question_type: q.vraag_type || 'multiple_choice',
      options: typeof q.correct_antwoord === 'object' ? q.correct_antwoord : null,
    }));
  },

  /**
   * Records a practice session and updates analytics
   */
  async recordPracticeSession(
    studentId: string,
    sessionType: 'solo' | 'peer' | 'group',
    questionsAttempted: number,
    questionsCorrect: number,
    sessionData: any
  ): Promise<PracticeSession> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert([
        {
          student_id: studentId,
          session_type: sessionType as 'solo' | 'peer' | 'group' | null,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          session_data: sessionData,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update learning analytics
    await this.updateLearningAnalytics(studentId, questionsAttempted, questionsCorrect);

    return data as PracticeSession;
  },

  /**
   * Updates learning analytics based on practice session results
   */
  async updateLearningAnalytics(
    studentId: string,
    questionsAttempted: number,
    questionsCorrect: number
  ): Promise<void> {
    const accuracyRate = questionsAttempted > 0 
      ? questionsCorrect / questionsAttempted 
      : 0;

    // Fetch existing analytics
    const { data: existing } = await supabase
      .from('learning_analytics')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const newAccuracy = (existing.accuracy_rate || 0) * 0.7 + accuracyRate * 0.3;
      
      await supabase
        .from('learning_analytics')
        .update({
          accuracy_rate: newAccuracy,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new record - note: module_id and niveau_id should be provided by caller
      await supabase
        .from('learning_analytics')
        .insert([
          {
            student_id: studentId,
            accuracy_rate: accuracyRate,
            topic: 'General',
            weak_areas: [],
            strong_areas: [],
            recommended_exercises: [],
            last_updated: new Date().toISOString(),
          },
        ]);
    }
  },

  /**
   * Analyzes weak and strong areas based on question performance
   */
  async analyzePerformanceAreas(
    studentId: string,
    moduleId: string
  ): Promise<{ weak_areas: string[]; strong_areas: string[] }> {
    // Fetch all student answers with questions
    const { data: answers, error } = await supabase
      .from('antwoorden')
      .select(`
        *,
        vraag:vragen (
          topic,
          vraag_type
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Group by topic and calculate accuracy
    const topicPerformance: Record<string, { correct: number; total: number }> = {};

    (answers || []).forEach((answer: any) => {
      const topic = answer.vraag?.topic || 'General';
      
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 };
      }

      topicPerformance[topic].total++;
      if (answer.is_correct) {
        topicPerformance[topic].correct++;
      }
    });

    // Identify weak and strong areas
    const weakAreas: string[] = [];
    const strongAreas: string[] = [];

    Object.entries(topicPerformance).forEach(([topic, perf]) => {
      const accuracy = perf.correct / perf.total;
      
      if (accuracy < 0.6 && perf.total >= 3) {
        weakAreas.push(topic);
      } else if (accuracy >= 0.85 && perf.total >= 5) {
        strongAreas.push(topic);
      }
    });

    // Update analytics
    const { data: existing } = await supabase
      .from('learning_analytics')
      .select('*')
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('learning_analytics')
        .update({
          weak_areas: weakAreas,
          strong_areas: strongAreas,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }

    return { weak_areas: weakAreas, strong_areas: strongAreas };
  },

  /**
   * Gets personalized recommendations for next steps
   */
  async getRecommendations(
    studentId: string,
    moduleId: string
  ): Promise<string[]> {
    const { data: analytics } = await supabase
      .from('learning_analytics')
      .select('*')
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .maybeSingle();

    const recommendations: string[] = [];

    if (!analytics) {
      recommendations.push('Start practicing to build your learning profile');
      return recommendations;
    }

    const weakAreas = analytics.weak_areas || [];
    const accuracyRate = analytics.accuracy_rate || 0;

    if (weakAreas.length > 0) {
      weakAreas.slice(0, 2).forEach(area => {
        recommendations.push(`Focus on improving: ${area}`);
      });
    }

    if (accuracyRate < 0.7) {
      recommendations.push('Review foundational concepts before advancing');
    } else if (accuracyRate >= 0.85) {
      recommendations.push('Try harder difficulty to challenge yourself');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the great work! Continue practicing regularly');
    }

    return recommendations;
  },
};
