
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Assuming you might have supabase types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined in environment variables. Missing NEXT_PUBLIC_SUPABASE_URL.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is not defined in environment variables. Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

// Note: The Database generic type is optional but good for type safety if you have generated Supabase types.
// If you don't have types generated, you can remove `<Database>`
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
