
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient';
import type { DesignCollaborationCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET all design collaboration categories
export async function GET() {
  const clientForRead = supabaseAdmin || fallbackSupabase;
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
        return NextResponse.json({ 
            message: `Failed to fetch categories from database. Supabase: ${error.message}`,
            rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
        }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('[API ADMIN DCC GET] Unhandled error:', e);
    return NextResponse.json({ 
        message: 'An unexpected error occurred while fetching categories.',
        errorDetails: e.message,
        rawSupabaseError: { message: e.message }
    }, { status: 500 });
  }
}

// POST a new design collaboration category
export async function POST(request: NextRequest) {
  try {
    const supabaseService = supabaseAdmin;
    if (!supabaseService) {
      console.error('[API ADMIN DCC POST] CRITICAL: Supabase Service Role Client (supabaseAdmin) is not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable and server restart.');
      return NextResponse.json({
        message: 'Database admin client not configured. Cannot create category. Service role key might be missing.',
        rawSupabaseError: { message: 'Admin database client (service_role) not available.' }
      }, { status: 503 });
    }
    console.log('[API ADMIN DCC POST] Attempting to create design collaboration category. Using ADMIN client (service_role).');

    let body;
    try {
        body = await request.json() as Omit<DesignCollaborationCategory, 'id' | 'createdAt' | 'updatedAt'>;
    } catch (jsonError: any) {
        console.error("[API ADMIN DCC POST] Error parsing request JSON:", jsonError);
        return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
    }
    console.log("[API ADMIN DCC POST] Received body:", JSON.stringify(body, null, 2));

    if (!body.name || body.name.trim() === '') {
        return NextResponse.json({ message: "Category name is required." }, { status: 400 });
    }
    
    const categoryToInsert = {
      name: body.name,
      slug: body.slug?.trim() || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.image_url || null,
      ai_image_prompt: body.ai_image_prompt || null,
      // createdAt and updatedAt will be handled by database defaults/triggers
    };
    console.log("[API ADMIN DCC POST] Data to insert:", JSON.stringify(categoryToInsert, null, 2));

    const { data: insertedData, error: insertError } = await supabaseService
      .from('design_collaboration_categories')
      .insert(categoryToInsert)
      .select()
      .single();

    if (insertError) {
        console.error('[API ADMIN DCC POST] Supabase error creating category:', JSON.stringify(insertError, null, 2));
        return NextResponse.json({
            message: `Failed to create category in database. Supabase error: ${insertError.message}`,
            rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
        }, { status: insertError.code === '23505' ? 409 : 500 }); // 409 for unique constraint violation
    }
    if (!insertedData) {
        console.error('[API ADMIN DCC POST] Supabase insert succeeded but returned no data.');
        return NextResponse.json({ message: 'Category creation succeeded but no data returned from database.' }, { status: 500 });
    }
    console.log("[API ADMIN DCC POST] Category created successfully:", insertedData.name);
    return NextResponse.json(insertedData, { status: 201 });

  } catch (e: any) { // Catch any other unexpected errors
    console.error('[API ADMIN DCC POST] Unhandled exception during category creation:', e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unexpected server error occurred.';
    return NextResponse.json({
        message: 'Failed to create category due to an unexpected server error.',
        errorDetails: errorMessage,
        rawSupabaseError: { message: errorMessage }
    }, { status: 500 });
  }
}
