// Supabase client configuration using environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ENV_CONFIG } from '@/config/environment';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  ENV_CONFIG.SUPABASE.URL, 
  ENV_CONFIG.SUPABASE.ANON_KEY, 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);