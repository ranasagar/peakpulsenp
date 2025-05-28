
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient';
import type { DesignCollaborationCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET all design collaboration categories
export async function GET() {
  const clientForRead = supabaseAdmin || fallbackSupabase; // Can use public client for reads if admin isn't strictly needed
  if (!clientForRead) {
    console.error('[API ADMIN DCC GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  console.log(`[API ADMIN DCC GET] Fetching categories. Using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);

  try {
    const { data, error } = await clientForRead
      .from('design_collaboration_categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
        console.error('[API ADMIN DCC GET] Supabase error fetching categories:', error);
        return NextResponse.json({ message: 'Failed to fetch categories from database.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('[API ADMIN DCC GET] Unhandled error:', e);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}

// POST a new design collaboration category
export async function POST(request: NextRequest) {
  const supabaseService = supabaseAdmin; // Admin writes MUST use service_role
  if (!supabaseService) {
    console.error('[API ADMIN DCC POST] CRITICAL: Supabase Service Role Client (supabaseAdmin) is not initialized. Writes will fail. Check SUPABASE_SERVICE_ROLE_KEY environment variable and server restart.');
    return NextResponse.json({
      message: 'Database admin client not configured for write operations. Service role key might be missing.',
      rawSupabaseError: { message: 'Admin database client (service_role) not available for creating design collaboration category.' }
    }, { status: 503 });
  }
  console.log('[API ADMIN DCC POST] Attempting to create design collaboration category. Using ADMIN client (service_role).');

  try {
    const body = await request.json() as Omit<DesignCollaborationCategory, 'id' | 'createdAt' | 'updatedAt'>;
    console.log("[API ADMIN DCC POST] Received body:", body);

    const categoryToInsert = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.image_url || null,
      ai_image_prompt: body.ai_image_prompt || null,
      // createdAt and updatedAt will be handled by database defaults/triggers
    };
    console.log("[API ADMIN DCC POST] Data to insert:", categoryToInsert);

    const { data, error } = await supabaseService
      .from('design_collaboration_categories')
      .insert(categoryToInsert)
      .select()
      .single();

    if (error) {
        console.error('[API ADMIN DCC POST] Supabase error creating category:', error);
        return NextResponse.json({ message: 'Failed to create category in database.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('[API ADMIN DCC POST] Unhandled error:', e);
    if (e instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: e.message }, { status: 400 });
    }
    return NextResponse.json({ message: e.message || "An unexpected error occurred.", details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}
    