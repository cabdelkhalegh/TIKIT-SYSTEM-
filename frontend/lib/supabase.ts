import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the browser
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Export the createClient function for components that need it
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// For client components that need a fresh client
export function createClientComponentClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
