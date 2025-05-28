// /src/app/api/design-collaborations/[slug]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Use public client
import type { DesignCollaborationGallery } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  console.log(`[API /api/design-collaborations/${slug} GET] Request received.`);

  if (!supabase) {
    console.error(`[API /api/design-collaborations/${slug} GET] Supabase client is not initialized.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!slug) {
    return NextResponse.json({ message: 'Collaboration slug is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('design_collaborations')
      .select(`
        *,
        category:design_collaboration_categories (name, slug)
      `)
      .eq('slug', slug)
      .eq('is_published', true) // Ensure only published galleries are fetched by slug
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for "0 rows"
        console.warn(`[API /api/design-collaborations/${slug} GET] Collaboration not found or not published.`);
        return NextResponse.json({ message: `Collaboration with slug '${slug}' not found or not published.` }, { status: 404 });
      }
      console.error(`[API /api/design-collaborations/${slug} GET] Supabase error:`, error);
      return NextResponse.json({ 
        message: 'Failed to fetch collaboration details.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }

    if (!data) {
      // Should be caught by PGRST116, but as a fallback
      console.warn(`[API /api/design-collaborations/${slug} GET] Collaboration not found or not published (data was null).`);
      return NextResponse.json({ message: `Collaboration with slug '${slug}' not found or not published.` }, { status: 404 });
    }
    
    const gallery = {
        ...data,
        category_name: data.category?.name || null,
        category_slug: data.category?.slug || null
    };
    
    console.log(`[API /api/design-collaborations/${slug} GET] Collaboration fetched successfully:`, gallery.title);
    return NextResponse.json(gallery);
  } catch (e: any) {
    console.error(`[API /api/design-collaborations/${slug} GET] Unhandled error:`, e);
    return NextResponse.json({ message: 'Server error fetching collaboration details.', errorDetails: e.message }, { status: 500 });
  }
}
