// /src/app/api/design-collaboration-categories/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Use public client
import type { DesignCollaborationCategory } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("[API /api/design-collaboration-categories GET] Request received for public categories.");
  if (!supabase) {
    console.error('[API /api/design-collaboration-categories GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('design_collaboration_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[API /api/design-collaboration-categories GET] Supabase error fetching categories:', error);
      return NextResponse.json({ 
        message: 'Failed to fetch design collaboration categories from database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    console.log(`[API /api/design-collaboration-categories GET] Successfully fetched ${data?.length || 0} categories.`);
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('[API /api/design-collaboration-categories GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching categories.', errorDetails: e.message }, { status: 500 });
  }
}
