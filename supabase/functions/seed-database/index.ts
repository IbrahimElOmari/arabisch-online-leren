import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Starting database seeding...');

    // Create admin user
    const adminPassword = Deno.env.get('ADMIN_INITIAL_PASSWORD') || 'admin123!';
    
    const { data: adminUser, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@arabischonline.nl',
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      }
    });

    if (adminAuthError && !adminAuthError.message.includes('already registered')) {
      throw adminAuthError;
    }

    console.log('Admin user created/verified');

    // Create dummy teacher
    const { data: teacherUser, error: teacherAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'leerkracht@arabischonline.nl',
      password: 'teacher123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Leerkracht Fatima',
        role: 'leerkracht'
      }
    });

    if (teacherAuthError && !teacherAuthError.message.includes('already registered')) {
      throw teacherAuthError;
    }

    console.log('Teacher user created/verified');

    // Check if classes already exist
    const { data: existingClasses } = await supabaseAdmin
      .from('klassen')
      .select('id, name');

    if (!existingClasses || existingClasses.length === 0) {
      // Create two initial classes
      const { data: newClasses, error: classError } = await supabaseAdmin
        .from('klassen')
        .insert([
          {
            name: 'Arabisch Avontuur (Onder 16)',
            description: 'Een speelse en interactieve Arabische les voor jongeren onder de 16 jaar.',
            teacher_id: teacherUser?.user?.id
          },
          {
            name: 'Arabisch voor Beginners (16+)',
            description: 'Een grondige introductie tot de Arabische taal voor volwassenen en tieners vanaf 16 jaar.',
            teacher_id: teacherUser?.user?.id
          }
        ])
        .select();

      if (classError) throw classError;
      console.log('Classes created:', newClasses);

      // Create niveaus for each class (4 levels each)
      const niveauInserts = [];
      for (const klas of newClasses) {
        for (let i = 1; i <= 4; i++) {
          niveauInserts.push({
            class_id: klas.id,
            niveau_nummer: i,
            naam: `Niveau ${i}`,
            beschrijving: `Beschrijving voor niveau ${i} - ${klas.name}`
          });
        }
      }

      const { error: niveauError } = await supabaseAdmin
        .from('niveaus')
        .insert(niveauInserts);

      if (niveauError) throw niveauError;
      console.log('Niveaus created for classes');
    } else {
      console.log('Classes already exist, skipping creation');
    }

    // Create sample questions for niveau 1
    const { data: niveau1 } = await supabaseAdmin
      .from('niveaus')
      .select('id')
      .eq('niveau_nummer', 1)
      .limit(1)
      .single();

    if (niveau1) {
      const { data: existingQuestions } = await supabaseAdmin
        .from('vragen')
        .select('id')
        .eq('niveau_id', niveau1.id);

      if (!existingQuestions || existingQuestions.length === 0) {
        const sampleQuestions = [
          {
            niveau_id: niveau1.id,
            vraag_tekst: 'Hoe zeg je "Hallo" in het Arabisch?',
            vraag_type: 'enkelvoudig',
            opties: ['مرحبا', 'شكرا', 'وداعا', 'نعم'],
            correct_antwoord: ['مرحبا'],
            volgorde: 1
          },
          {
            niveau_id: niveau1.id,
            vraag_tekst: 'Schrijf de Arabische cijfers van 1 tot 5.',
            vraag_type: 'open',
            opties: null,
            correct_antwoord: ['١ ٢ ٣ ٤ ٥'],
            volgorde: 2
          },
          {
            niveau_id: niveau1.id,
            vraag_tekst: 'Welke van de volgende woorden betekenen familie-gerelateerde begrippen? (Meerdere antwoorden mogelijk)',
            vraag_type: 'meervoudig',
            opties: ['أب (vader)', 'أم (moeder)', 'كتاب (boek)', 'أخ (broer)', 'مدرسة (school)'],
            correct_antwoord: ['أب (vader)', 'أم (moeder)', 'أخ (broer)'],
            volgorde: 3
          }
        ];

        const { error: questionsError } = await supabaseAdmin
          .from('vragen')
          .insert(sampleQuestions);

        if (questionsError) throw questionsError;
        console.log('Sample questions created');
      }
    }

    // Log admin action
    if (adminUser?.user?.id) {
      await supabaseAdmin
        .from('audit_log')
        .insert({
          user_id: adminUser.user.id,
          actie: 'database_seeded',
          details: { 
            timestamp: new Date().toISOString(),
            classes_created: true,
            questions_created: true
          },
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Database seeding completed successfully',
        admin_email: 'admin@arabischonline.nl',
        teacher_email: 'leerkracht@arabischonline.nl'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(
      JSON.stringify({ 
        error: `Seeding failed: ${error.message}`,
        details: error.stack || 'No stack trace available'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});