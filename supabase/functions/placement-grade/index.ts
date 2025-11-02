import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GradeRequest {
  enrollment_id: string;
  placement_test_id: string;
  answers: any[];
}

interface Question {
  id: string;
  question_type: 'multiple_choice' | 'drag_drop' | 'fill_blank' | 'audio' | 'voice' | 'sequence';
  correct_answer: any;
  points?: number;
}

// Rate limiting storage (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}

function gradeAnswer(question: Question, answer: any): boolean {
  switch (question.question_type) {
    case 'multiple_choice':
      return JSON.stringify(question.correct_answer) === JSON.stringify(answer);
    
    case 'drag_drop':
      // Check if all pairs match
      if (!Array.isArray(answer) || !Array.isArray(question.correct_answer)) return false;
      return JSON.stringify(question.correct_answer.sort()) === JSON.stringify(answer.sort());
    
    case 'fill_blank':
      // Exact match or regex match
      if (typeof question.correct_answer === 'string') {
        const answerStr = String(answer).trim().toLowerCase();
        const correctStr = question.correct_answer.trim().toLowerCase();
        return answerStr === correctStr;
      }
      return false;
    
    case 'audio':
    case 'voice':
      // For now, exact match (in real scenario, use speech-to-text comparison)
      return String(answer).toLowerCase().trim() === String(question.correct_answer).toLowerCase().trim();
    
    case 'sequence':
      // Check if order matches
      return JSON.stringify(question.correct_answer) === JSON.stringify(answer);
    
    default:
      return false;
  }
}

function calculateScore(questions: Question[], answers: any[]): number {
  let totalPoints = 0;
  let earnedPoints = 0;

  questions.forEach((question, index) => {
    const points = question.points || 1;
    totalPoints += points;
    
    if (gradeAnswer(question, answers[index])) {
      earnedPoints += points;
    }
  });

  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
}

function assignLevel(score: number, levelRanges: Record<string, { min: number; max: number }>, moduleLevels: any[]): string | null {
  for (const [levelCode, range] of Object.entries(levelRanges)) {
    if (score >= range.min && score <= range.max) {
      const level = moduleLevels.find(l => l.level_code === levelCode);
      if (level) return level.id;
    }
  }
  
  // Default to first level if no match
  return moduleLevels[0]?.id || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Rate limiting
    const rateLimitKey = `placement-grade:${user.id}`;
    if (!checkRateLimit(rateLimitKey, 5, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again in 1 minute.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    const body: GradeRequest = await req.json();
    const { enrollment_id, placement_test_id, answers } = body;

    if (!enrollment_id || !placement_test_id || !answers) {
      throw new Error('Missing required fields');
    }

    // Verify enrollment belongs to user and status is pending_placement
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, student_id, module_id, status')
      .eq('id', enrollment_id)
      .eq('student_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found or unauthorized');
    }

    if (enrollment.status !== 'pending_placement') {
      throw new Error(`Invalid enrollment status: ${enrollment.status}. Expected pending_placement.`);
    }

    // Check idempotency - if result already exists, return it
    const { data: existingResult } = await supabase
      .from('placement_results')
      .select('*')
      .eq('student_id', user.id)
      .eq('placement_test_id', placement_test_id)
      .single();

    if (existingResult) {
      console.log(`[PLACEMENT] Result already exists for enrollment ${enrollment_id}`);
      return new Response(
        JSON.stringify({
          message: 'Test already graded',
          result: existingResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Get placement test
    const { data: test, error: testError } = await supabase
      .from('placement_tests')
      .select('*')
      .eq('id', placement_test_id)
      .eq('is_active', true)
      .single();

    if (testError || !test) {
      throw new Error('Placement test not found');
    }

    // Get module levels
    const { data: moduleLevels, error: levelsError } = await supabase
      .from('module_levels')
      .select('*')
      .eq('module_id', enrollment.module_id)
      .order('sequence_order');

    if (levelsError || !moduleLevels || moduleLevels.length === 0) {
      throw new Error('Module levels not found');
    }

    // Calculate score
    const questions = test.questions as Question[];
    const score = calculateScore(questions, answers);

    // Assign level based on score
    const levelRanges = test.level_ranges as Record<string, { min: number; max: number }>;
    const assignedLevelId = assignLevel(score, levelRanges, moduleLevels);

    // Create placement result
    const { data: result, error: resultError } = await supabase
      .from('placement_results')
      .insert({
        student_id: user.id,
        placement_test_id: placement_test_id,
        score,
        assigned_level_id: assignedLevelId,
        answers,
        test_name: test.test_name,
        metadata: {
          graded_at: new Date().toISOString(),
          questions_count: questions.length
        }
      })
      .select()
      .single();

    if (resultError) {
      console.error('Failed to create result:', resultError);
      throw new Error('Failed to save test result');
    }

    // Update enrollment with level and status
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        level_id: assignedLevelId,
        status: 'pending_class'
      })
      .eq('id', enrollment_id);

    if (updateError) {
      console.error('Failed to update enrollment:', updateError);
      throw new Error('Failed to update enrollment status');
    }

    console.log(`[PLACEMENT] Graded test for enrollment ${enrollment_id}: score ${score}, level ${assignedLevelId}`);

    return new Response(
      JSON.stringify({
        message: 'Test graded successfully',
        result,
        score,
        assigned_level_id: assignedLevelId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Placement grading error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
