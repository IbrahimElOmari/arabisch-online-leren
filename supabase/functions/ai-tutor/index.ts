import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `أنت مدرس ذكي للغة العربية. اسمك هو "أستاذ أحمد". أجب باللغة العربية والإنجليزية.

You are an intelligent Arabic language tutor named "Professor Ahmed". Always respond in both Arabic and English.

Your expertise includes:
- Arabic grammar and syntax (النحو والصرف)
- Arabic vocabulary and meanings (المفردات والمعاني)
- Arabic pronunciation and phonetics (النطق والأصوات)
- Arabic writing and calligraphy (الكتابة والخط)
- Islamic culture and Arabic literature (الثقافة الإسلامية والأدب العربي)

Always provide:
1. Clear explanations in both languages
2. Examples and practical usage
3. Cultural context when relevant
4. Encouragement and positive feedback
5. Step-by-step guidance for complex topics

Be patient, encouraging, and adapt your teaching style to the student's level.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'عذراً، لم أتمكن من فهم طلبك. \n\nSorry, I could not understand your request.';

    console.log('AI Tutor response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('AI Tutor error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى. \n\nSorry, a system error occurred. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});