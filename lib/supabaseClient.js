import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True only when both public env vars are set. The anon key is designed to
// be public; the service_role key must never be used in this frontend.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Null when Supabase is not configured, so the app can fall back to demo data
// instead of crashing at import time.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
