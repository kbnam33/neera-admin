import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are missing. Make sure to create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);