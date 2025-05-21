// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (!supabaseUrl) {
  console.error(
    '[SupabaseClient] CRITICAL: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing. Please set it in your .env file and restart the server.'
  );
} else if (!supabaseAnonKey) {
  console.error(
    '[SupabaseClient] CRITICAL: Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing. Please set it in your .env file and restart the server.'
  );
} else {
  try {
    // Log the URL and a masked version of the key to confirm they are being read
    console.log(`[SupabaseClient] Attempting to initialize with URL: ${supabaseUrl}`);
    console.log(`[SupabaseClient] Attempting to initialize with Anon Key starting with: ${supabaseAnonKey.substring(0, 10)}...`);
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[SupabaseClient] Supabase client initialized successfully.');
  } catch (error) {
    console.error('[SupabaseClient] CRITICAL: Error initializing Supabase client:', error);
    // supabaseInstance remains null in case of an error during createClient
  }
}

export const supabase = supabaseInstance;
