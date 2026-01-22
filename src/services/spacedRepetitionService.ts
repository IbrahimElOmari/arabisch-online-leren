/**
 * Spaced Repetition Service
 * 
 * Implements the SM-2 algorithm for optimal vocabulary learning
 */

import { supabase } from '@/integrations/supabase/client';
import { review as sm2Review, initialState } from '@/lib/srs/sm2';

export interface SpacedRepetitionCard {
  id: string;
  student_id: string;
  arabic_word: string;
  translation: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  created_at: string;
  vocabulary_id?: string;
}

export interface ReviewResult {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface StudentStats {
  total: number;
  dueToday: number;
  mastered: number;
  learning: number;
  newCards: number;
}

export const qualityRatings = [
  { value: 0, label: 'Vergeten', description: 'Totaal vergeten', color: 'destructive' },
  { value: 1, label: 'Fout', description: 'Incorrect antwoord', color: 'destructive' },
  { value: 2, label: 'Moeilijk', description: 'Met veel moeite herinnerd', color: 'orange' },
  { value: 3, label: 'Goed', description: 'Correct met enige moeite', color: 'yellow' },
  { value: 4, label: 'Makkelijk', description: 'Correct met weinig moeite', color: 'green' },
  { value: 5, label: 'Perfect', description: 'Onmiddellijk herinnerd', color: 'green' },
] as const;

// Helper to map DB row to typed card
function mapDbToCard(row: any): SpacedRepetitionCard {
  return {
    id: row.id,
    student_id: row.student_id,
    arabic_word: row.arabic_word,
    translation: row.translation,
    ease_factor: row.ease_factor ?? 2.5,
    interval_days: row.interval_days ?? 0,
    repetitions: row.repetitions ?? 0,
    next_review_date: row.next_review_date ?? new Date().toISOString(),
    last_reviewed_at: row.last_reviewed_at,
    created_at: row.created_at ?? new Date().toISOString(),
    vocabulary_id: row.vocabulary_id,
  };
}

export const spacedRepetitionService = {
  async getDueCards(studentId: string, limit = 20): Promise<SpacedRepetitionCard[]> {
    const { data, error } = await supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('student_id', studentId)
      .lte('next_review_date', new Date().toISOString())
      .order('next_review_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapDbToCard);
  },

  async getAllCards(studentId: string): Promise<SpacedRepetitionCard[]> {
    const { data, error } = await supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbToCard);
  },

  async recordReview(result: ReviewResult): Promise<SpacedRepetitionCard> {
    const { data: row, error: fetchError } = await supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('id', result.cardId)
      .single();

    if (fetchError || !row) throw new Error('Card not found');

    const card = mapDbToCard(row);
    const currentState = {
      interval: card.interval_days,
      repetition: card.repetitions,
      easeFactor: card.ease_factor,
      due: card.next_review_date,
    };

    const newState = sm2Review(currentState, { grade: result.quality });

    const { data: updated, error: updateError } = await supabase
      .from('spaced_repetition_cards')
      .update({
        ease_factor: newState.easeFactor,
        interval_days: newState.interval,
        repetitions: newState.repetition,
        next_review_date: newState.due,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', result.cardId)
      .select()
      .single();

    if (updateError) throw updateError;
    return mapDbToCard(updated);
  },

  async addVocabularyCard(studentId: string, arabicWord: string, translation: string): Promise<SpacedRepetitionCard> {
    const initial = initialState();
    
    const { data, error } = await supabase
      .from('spaced_repetition_cards')
      .insert({
        student_id: studentId,
        arabic_word: arabicWord,
        translation: translation,
        vocabulary_id: crypto.randomUUID(),
        ease_factor: initial.easeFactor,
        interval_days: initial.interval,
        repetitions: initial.repetition,
        next_review_date: initial.due,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDbToCard(data);
  },

  async getStudentStats(studentId: string): Promise<StudentStats> {
    const { data, error } = await supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;

    const cards = (data || []).map(mapDbToCard);
    const now = new Date();

    return {
      total: cards.length,
      dueToday: cards.filter((c) => new Date(c.next_review_date) <= now).length,
      mastered: cards.filter((c) => c.repetitions >= 5 && c.ease_factor >= 2.5).length,
      learning: cards.filter((c) => c.repetitions > 0 && c.repetitions < 5).length,
      newCards: cards.filter((c) => c.repetitions === 0).length,
    };
  },

  async resetCard(cardId: string): Promise<SpacedRepetitionCard> {
    const initial = initialState();
    
    const { data, error } = await supabase
      .from('spaced_repetition_cards')
      .update({
        ease_factor: initial.easeFactor,
        interval_days: initial.interval,
        repetitions: initial.repetition,
        next_review_date: initial.due,
        last_reviewed_at: null,
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) throw error;
    return mapDbToCard(data);
  },
};

export default spacedRepetitionService;
