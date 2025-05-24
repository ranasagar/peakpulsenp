
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient'; // Import both
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single category (for editing form prefill, though admin page fetches all)
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabase = supabaseAdmin || fallbackSupabase; // Use admin if available, else public
  const clientName = supabase === supabaseAdmin ? "ADMIN client" : "public client";
  console.log(`[API ADMIN CATEGORY GET /${categoryId}] Request received. Using ${clientName}.`);


  if (!supabase) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase client is not initialized.`);
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Database client not initialized.'} }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent_id') // Ensure parent_id is selected
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
     if (!data) { // Should be caught by PGRST116, but as a fallback
      return NextResponse.json({ message: 'Category not found (no data)' }, { status: 404 });
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
    console.log(`[API ADMIN CATEGORY GET /${categoryId}] Category fetched successfully:`, responseCategory.name);
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}


// PUT (Update) an existing category
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabaseClientToUse = supabaseAdmin || fallbackSupabase; // Prefer admin client
  const clientName = supabaseClientToUse === supabaseAdmin ? "ADMIN client (service_role)" : "public fallback client";

  console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received request. Using ${clientName}.`);

  if (!supabaseClientToUse) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase client for write is not initialized.`);
    return NextResponse.json({ message: 'Database client for write operations not configured.', rawSupabaseError: { message: 'Supabase client for write not initialized.'} }, { status: 503 });
  }
  if (!supabaseAdmin) {
      console.warn(`[API ADMIN CATEGORY PUT /${categoryId}] WARNING: Supabase ADMIN client (service_role) is not available. Falling back to public client. RLS policies for 'authenticated' admin role will apply if not bypassed.`);
  }

  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<AdminCategory>;
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received body:`, JSON.stringify(body, null, 2));

    const categoryToUpdate: { [key: string]: any } = {};

    if (body.hasOwnProperty('name')) {
        categoryToUpdate.name = body.name;
        // If name changes and slug is not explicitly provided OR is empty, regenerate slug
        if (body.name && (body.slug === undefined || (typeof body.slug === 'string' && body.slug.trim() === ''))) {
            categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        }
    }
    // If slug is explicitly provided and not empty, use it. Takes precedence.
    if (body.hasOwnProperty('slug') && typeof body.slug === 'string' && body.slug.trim() !== '') {
        categoryToUpdate.slug = body.slug.trim();
    }
    
    if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null;
    if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null;
    
    if (body.hasOwnProperty('parentId')) {
      categoryToUpdate.parent_id = body.parentId === '' || body.parentId === undefined ? null : body.parentId;
    }
    
    // Rely on database trigger for "updatedAt"
    // categoryToUpdate["updatedAt"] = new Date().toISOString();

    if (Object.keys(categoryToUpdate).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update provided.' }, { status: 400 });
    }

    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Attempting to update with payload:`, JSON.stringify(categoryToUpdate, null, 2));

    const { data: updatedData, error } = await supabaseClientToUse
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select('*, parent_id') // Re-fetch all columns including parent_id
      .single();

    if (error) {
      console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase error updating category:`, error);
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ message: 'Category not found or update constraint issue.' }, { status: 404 });
      }
      return NextResponse.json({ 
        message: `Database error: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    if (!updatedData) {
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
      updatedAt: updatedData.updatedAt || updated_at, // Use the actual column name returned by Supabase
    };
    
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Category updated successfully:`, responseCategory.name);
    return NextResponse.json(responseCategory);

  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Unhandled error:`, e);
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
  const supabaseClientToUse = supabaseAdmin || fallbackSupabase; // Prefer admin client
  const clientName = supabaseClientToUse === supabaseAdmin ? "ADMIN client (service_role)" : "public fallback client";
  console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Received request. Using ${clientName}.`);

  if (!supabaseClientToUse) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Supabase client for write is not initialized.`);
    return NextResponse.json({ message: 'Database client for write operations not configured.', rawSupabaseError: { message: 'Supabase client for write not initialized.'} }, { status: 503 });
  }
   if (!supabaseAdmin) {
      console.warn(`[API ADMIN CATEGORY DELETE /${categoryId}] WARNING: Supabase ADMIN client (service_role) is not available. Falling back to public client. RLS policies for 'authenticated' admin role will apply if not bypassed.`);
  }

  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseClientToUse
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Supabase error deleting category:`, error);
      return NextResponse.json({ 
        message: `Database error: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Category deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: "Failed to delete category.", errorDetails: e.message }, { status: 500 });
  }
}
