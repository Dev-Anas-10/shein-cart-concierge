import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_REF = 'sxcsgnzkgwctafqxkfdd';
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  `https://${SUPABASE_PROJECT_REF}.supabase.co`;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Y3NnbnprZ3djdGFmcXhrZmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MDg5MDEsImV4cCI6MjEwODQ4NDkwMX0.NtnDGpdvEATEgPhj9rozP4UxgbxqoCwZMY-D-uqHRRE';

let _supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;
  if (!SUPABASE_ANON_KEY) return null;

  try {
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _supabaseClient;
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
    return null;
  }
}
