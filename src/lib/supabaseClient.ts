// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (!supabaseUrl) {
  console.error(
    '[SupabaseClient] Supabase URL is missing. Please set NEXT_PUBLIC_SUPABASE_URL in your .env file and restart the server.'
  );
} else if (!supabaseAnonKey) {
  console.error(
    '[SupabaseClient] Supabase Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file and restart the server.'
  );
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[SupabaseClient] Supabase client initialized successfully.');
  } catch (error) {
    console.error('[SupabaseClient] Error initializing Supabase client:', error);
    // supabaseInstance will remain null
  }
}

export const supabase = supabaseInstance;
