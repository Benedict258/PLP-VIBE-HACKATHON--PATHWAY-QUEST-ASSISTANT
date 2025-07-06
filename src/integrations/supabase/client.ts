
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use fallback values if environment variables are not available
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ibulcuogsdkaxzbzwvrg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidWxjdW9nc2RrYXh6Ynp3dnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTUwNzAsImV4cCI6MjA2NzEzMTA3MH0.r-HQY9Q93KplWG1oSYqz0vr347XO1goWxzmz90NWzds';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Supabase environment variables are missing!');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
