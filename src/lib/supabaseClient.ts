// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

if (!supabaseUrl) {
  console.error(
    '[SupabaseClient] CRITICAL: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing. Please set it in your .env file and restart the server. Public client will be null.'
  );
} else if (!supabaseAnonKey) {
  console.error(
    '[SupabaseClient] CRITICAL: Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing. Please set it in your .env file and restart the server. Public client will be null.'
  );
} else {
  try {
    console.log(`[SupabaseClient] Attempting to initialize PUBLIC client with URL: ${supabaseUrl}`);
    console.log(`[SupabaseClient] Attempting to initialize PUBLIC client with Anon Key starting with: ${supabaseAnonKey.substring(0, 10)}...`);
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[SupabaseClient] PUBLIC Supabase client initialized successfully.');
  } catch (error) {
    console.error('[SupabaseClient] CRITICAL: Error initializing PUBLIC Supabase client:', error);
    supabaseInstance = null; // Ensure it's null on failure
  }
}

if (typeof window === 'undefined') { // Only initialize admin client on the server
  if (!supabaseUrl) {
    console.error(
      '[SupabaseClient] CRITICAL SERVER-SIDE ERROR: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing. Cannot initialize admin client.'
    );
  } else if (!supabaseServiceRoleKey) {
    console.error(
      '[SupabaseClient] CRITICAL SERVER-SIDE ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env. Admin operations requiring elevated privileges will likely fail or use the public anon key (subject to RLS). Admin client will be null.'
    );
  } else {
    try {
      console.log(`[SupabaseClient] Attempting to initialize ADMIN client with URL: ${supabaseUrl}`);
      // Do not log service role key, even partially
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('[SupabaseClient] ADMIN Supabase client initialized successfully.');
    } catch (error) {
      console.error('[SupabaseClient] CRITICAL SERVER-SIDE ERROR: Error initializing ADMIN Supabase client:', error);
      supabaseAdminInstance = null; // Ensure it's null on failure
    }
  }
}

export const supabase = supabaseInstance; // Public client for general use
export const supabaseAdmin = supabaseAdminInstance; // Admin client for server-side privileged operations
