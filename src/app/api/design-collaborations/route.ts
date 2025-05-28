// /src/app/api/design-collaborations/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Use public client
import type { DesignCollaborationGallery } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("[API /api/design-collaborations GET] Request received for public collaborations.");
  if (!supabase) {
    console.error('[API /api/design-collaborations GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    // Fetch published collaborations and join with categories to get category_name
    const { data, error } = await supabase
      .from('design_collaborations')
      .select(`
        *,
        category:design_collaboration_categories (name)
      `)
      .eq('is_published', true)
      .order('collaboration_date', { ascending: false, nullsFirst: false })
      .order('"createdAt"', { ascending: false });

    if (error) {
      console.error('[API /api/design-collaborations GET] Supabase error fetching collaborations:', error);
      return NextResponse.json({ 
        message: 'Failed to fetch design collaborations from database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }

    const galleries = data?.map((g: any) => ({
      ...g,
      category_name: g.category?.name || null // Ensure category_name is extracted correctly
    })) || [];
    
    console.log(`[API /api/design-collaborations GET] Successfully fetched ${galleries.length} published collaborations.`);
    return NextResponse.json(galleries);
  } catch (e: any) {
    console.error('[API /api/design-collaborations GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching collaborations.', errorDetails: e.message }, { status: 500 });
  }
}
