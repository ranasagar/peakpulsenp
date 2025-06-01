// /src/app/api/promotional-posts/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Use public client
import type { PromotionalPost } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabase) {
    console.error('[API /api/promotional-posts GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  console.log("[API /api/promotional-posts GET] Request received for public promotional posts.");

  try {
    const { data, error } = await supabase
      .from('promotional_posts')
      .select('*')
      .eq('is_active', true) // Fetch only active posts
      .order('display_order', { ascending: true, nullsLast: true }) // Ensure consistent ordering
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/promotional-posts GET] Supabase error fetching promotional posts:', error);
      return NextResponse.json({ 
        message: 'Failed to fetch promotional posts from database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    console.log(`[API /api/promotional-posts GET] Successfully fetched ${data?.length || 0} active promotional posts.`);
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('[API /api/promotional-posts GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching promotional posts.', errorDetails: e.message }, { status: 500 });
  }
}
