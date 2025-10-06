import { createClient } from "@supabase/supabase-js";

// --- Environment Variables ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// --- Debugging: Check if keys are loaded ---
// You can remove these lines after confirming it works
console.log("Supabase URL Loaded:", !!supabaseUrl);
console.log("Supabase Anon Key Loaded:", !!supabaseAnonKey);
console.log("Supabase Service Key Loaded:", !!supabaseServiceKey);
// --- End Debugging ---

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("One or more Supabase environment variables are missing.");
}

// --- Client for Authentication (uses public anon key) ---
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Client for Data Operations (uses secret service_role key) ---
// This client bypasses RLS and is used by the dataProvider.
export const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: false,
  },
});