
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts'; // Use admin for writes
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single category (not typically used if admin page fetches all, but good for completeness)
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabase = supabaseAdmin || fallbackSupabase; // Prefer admin, fallback for safety if needed for reads by anon

  if (!supabase) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase client is not initialized.`);
    return NextResponse.json({ message: 'Database client not configured. Check server logs and .env file for SUPABASE_SERVICE_ROLE_KEY for admin operations or public keys for general access.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent_id')
      .eq('id', categoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Row not found
        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
      }
      console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase error fetching category:`, error);
      return NextResponse.json({ 
        message: error.message || "Failed to fetch category.", 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
     if (!data) { // Should be caught by PGRST116, but as a safeguard
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    const responseCategory: AdminCategory = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      imageUrl: data.image_url,
      aiImagePrompt: data.ai_image_prompt,
      parentId: data.parent_id,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
    };
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred while fetching the category." }, { status: 500 });
  }
}


// PUT (Update) an existing category
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabase = supabaseAdmin || fallbackSupabase; 
  // For write operations like UPDATE, it's strongly recommended that 'supabase' here resolves to supabaseAdmin
  // to bypass RLS if the calling user's admin status has already been verified by your Next.js auth layer.

  console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received request. Using ${supabase === supabaseAdmin ? "ADMIN client" : "public client"}.`);

  if (!supabase) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase client is not initialized.`);
    return NextResponse.json({ message: 'Database client not configured. Check server logs for SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 });
  }
  if (!categoryId) {
    console.warn(`[API ADMIN CATEGORY PUT /${categoryId}] Category ID is missing from params.`);
    return NextResponse.json({ message: 'Category ID is required in URL path' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<AdminCategory>; // Use AdminCategory for consistent field names from client
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received body:`, JSON.stringify(body, null, 2));

    const categoryToUpdate: { [key: string]: any } = {};

    if (body.name !== undefined) {
      categoryToUpdate.name = body.name;
      // If name changes and slug is not explicitly provided in body OR is empty, regenerate slug
      if (body.slug === undefined || (typeof body.slug === 'string' && body.slug.trim() === '')) {
        categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Regenerated slug to: ${categoryToUpdate.slug}`);
      }
    }
    // If slug is explicitly provided and not empty, use it. This takes precedence.
    if (body.slug !== undefined && typeof body.slug === 'string' && body.slug.trim() !== '') {
      categoryToUpdate.slug = body.slug;
    }

    // Handle optional text fields: map client names to DB names, convert empty strings from form to null for DB
    if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null;
    if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null;
    
    // parentId can be string or null from client after NO_PARENT_ID_VALUE conversion
    if (body.hasOwnProperty('parentId')) {
        categoryToUpdate.parent_id = body.parentId; // body.parentId is already null or a string ID from client logic
    }
    
    // Rely on the database trigger for "updatedAt". Do not set it here.

    if (Object.keys(categoryToUpdate).length === 0) {
      console.log(`[API ADMIN CATEGORY PUT /${categoryId}] No fields to update were provided in the body.`);
      return NextResponse.json({ message: 'No fields to update provided.' }, { status: 400 });
    }

    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Attempting to update with payload:`, JSON.stringify(categoryToUpdate, null, 2));

    const { data: updatedData, error } = await supabase
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select('*, parent_id') // Re-fetch all columns including parent_id
      .single(); // .single() will error if 0 or >1 rows are affected by .eq() and update.

    if (error) {
      console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase error updating category:`, error);
      return NextResponse.json({ 
        message: error.message || "Failed to update category in database.",
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: error.code === 'PGRST116' ? 404 : 500 }); // PGRST116 is "Row not found"
    }
    if (!updatedData && !error) { // Should ideally not happen if .single() is used without error.
        console.warn(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase update returned no data and no error for categoryId.`);
        return NextResponse.json({ message: 'Category not found or update failed to return data.' }, { status: 404 });
    }
    
    const responseCategory: AdminCategory = {
      id: updatedData.id,
      name: updatedData.name,
      slug: updatedData.slug,
      description: updatedData.description,
      imageUrl: updatedData.image_url,
      aiImagePrompt: updatedData.ai_image_prompt,
      parentId: updatedData.parent_id,
      createdAt: updatedData.createdAt || updatedData.created_at,
      updatedAt: updatedData.updatedAt || updatedData.updated_at, // This will be the value set by the trigger
    };
    
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Category updated successfully:`, responseCategory);
    return NextResponse.json(responseCategory);

  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Unhandled error updating category:`, e);
    // Check if it's a JSON parsing error
    if (e instanceof SyntaxError && e.message.toLowerCase().includes("json")) {
      return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: e.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update category. An unexpected error occurred.", errorDetails: e.message }, { status: 500 });
  }
}

// DELETE an existing category
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabase = supabaseAdmin || fallbackSupabase;
  console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Received request. Using ${supabase === supabaseAdmin ? "ADMIN client" : "public client"}.`);

  if (!supabase) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Supabase client is not initialized.`);
    return NextResponse.json({ message: 'Database client not configured. Check server logs.' }, { status: 503 });
  }
  if (!categoryId) {
    console.warn(`[API ADMIN CATEGORY DELETE /${categoryId}] Category ID is missing.`);
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Supabase error deleting category:`, error);
      return NextResponse.json({ 
        message: error.message || "Failed to delete category from database.",
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Category deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Unhandled error deleting category:`, e);
    return NextResponse.json({ message: "Failed to delete category. An unexpected error occurred.", errorDetails: e.message }, { status: 500 });
  }
}
