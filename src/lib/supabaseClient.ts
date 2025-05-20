// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (!supabaseUrl) {
  console.error(
    'Supabase URL is missing. Please set NEXT_PUBLIC_SUPABASE_URL in your .env file.'
  );
} else if (!supabaseAnonKey) {
  console.error(
    'Supabase Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[SupabaseClient] Supabase client initialized successfully.');
  } catch (error) {
    console.error('[SupabaseClient] Error initializing Supabase client:', error);
  }
}

// Export the instance. It might be null if config is missing or initialization failed.
// Consuming modules should handle this, though typically we'd want to ensure config is always present.
export const supabase = supabaseInstance;
