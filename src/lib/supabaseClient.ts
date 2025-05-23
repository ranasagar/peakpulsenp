// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

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
    console.log(`[SupabaseClient] Attempting to initialize public client with URL: ${supabaseUrl}`);
    console.log(`[SupabaseClient] Attempting to initialize public client with Anon Key starting with: ${supabaseAnonKey.substring(0, 10)}...`);
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[SupabaseClient] Public Supabase client initialized successfully.');
  } catch (error) {
    console.error('[SupabaseClient] CRITICAL: Error initializing public Supabase client:', error);
  }
}

if (typeof window === 'undefined') { // Only initialize admin client on the server
  if (!supabaseServiceRoleKey) {
    console.warn(
      '[SupabaseClient] WARNING: Supabase Service Role Key (SUPABASE_SERVICE_ROLE_KEY) is missing. Admin operations requiring elevated privileges will fail. Add it to your .env file for server-side use and restart.'
    );
  } else if (supabaseUrl) { // Ensure supabaseUrl is also available for admin client
    try {
      console.log(`[SupabaseClient] Attempting to initialize admin client with URL: ${supabaseUrl}`);
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          // autoRefreshToken: false, // Optional: service role doesn't usually need token refresh
          // persistSession: false, // Optional: service role doesn't usually need session persistence
        }
      });
      console.log('[SupabaseClient] Admin Supabase client initialized successfully.');
    } catch (error) {
      console.error('[SupabaseClient] CRITICAL: Error initializing admin Supabase client:', error);
    }
  }
}


export const supabase = supabaseInstance; // Public client for general use
export const supabaseAdmin = supabaseAdminInstance; // Admin client for server-side privileged operations
