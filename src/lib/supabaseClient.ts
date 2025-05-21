// src/lib/supabaseClient.ts
// import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: any = null; // Use 'any' to avoid type errors if SupabaseClient is not imported

// console.log('[SupabaseClient] DEBUG: Attempting to initialize Supabase client (or skip if vars missing)...');

// if (!supabaseUrl) {
//   console.error(
//     '[SupabaseClient] Supabase URL is missing. Please set NEXT_PUBLIC_SUPABASE_URL in your .env file and restart the server.'
//   );
// } else if (!supabaseAnonKey) {
//   console.error(
//     '[SupabaseClient] Supabase Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file and restart the server.'
//   );
// } else {
//   try {
//     // supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
//     // console.log('[SupabaseClient] Supabase client would be initialized here if uncommented.');
//   } catch (error) {
//     console.error('[SupabaseClient] Error attempting to initialize Supabase client:', error);
//   }
// }
console.log('[SupabaseClient] Exporting supabase as null for debugging purposes.');
export const supabase = supabaseInstance;
