
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts';
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single category (already exists, no changes needed here for this specific error)
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabase = supabaseAdmin || fallbackSupabase;

  if (!supabase) {
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
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
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
      }
      console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase error fetching category:`, error);
      return NextResponse.json({ 
        message: error.message || "Failed to fetch category.", 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
     if (!data) {
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
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}


// PUT (Update) an existing category
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabaseClientToUse = supabaseAdmin || fallbackSupabase;

  console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received request. Using ${supabaseClientToUse === supabaseAdmin ? "ADMIN client" : "public client"}.`);

  if (!supabaseClientToUse) {
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<AdminCategory>;
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received body:`, JSON.stringify(body, null, 2));

    const categoryToUpdate: { [key: string]: any } = {};

    if (body.name !== undefined) {
      categoryToUpdate.name = body.name;
      // If name changes and slug is not explicitly provided OR is empty, regenerate slug
      if (body.slug === undefined || (typeof body.slug === 'string' && body.slug.trim() === '')) {
        categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      }
    }
    // If slug is explicitly provided and not empty, use it. Takes precedence over auto-generation.
    if (body.slug !== undefined && typeof body.slug === 'string' && body.slug.trim() !== '') {
      categoryToUpdate.slug = body.slug.trim();
    }

    // Handle optional text fields: map client names to DB names, convert empty strings from form to null for DB
    if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null; // Ensure DB column is image_url
    if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null; // Ensure DB column is ai_image_prompt
    
    if (body.hasOwnProperty('parentId')) {
      // The client-side form sends NO_PARENT_ID_VALUE which is then converted to null by form logic before submit,
      // or it sends an actual ID string. So body.parentId should be string or null.
      categoryToUpdate.parent_id = body.parentId === '' ? null : body.parentId;
    }
    
    // The database trigger should handle updatedAt automatically
    // categoryToUpdate["updatedAt"] = new Date().toISOString(); // Rely on trigger

    if (Object.keys(categoryToUpdate).length === 0) {
      return NextResponse.json({ message: 'No fields to update provided.' }, { status: 400 });
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
      if (error.code === 'PGRST116') { // Row not found or more than one row returned by .single()
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
      updatedAt: updatedData.updatedAt || updatedData.updated_at,
    };
    
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Category updated successfully:`, responseCategory);
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
  const supabaseClientToUse = supabaseAdmin || fallbackSupabase;
  console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Received request. Using ${supabaseClientToUse === supabaseAdmin ? "ADMIN client" : "public client"}.`);

  if (!supabaseClientToUse) {
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
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
