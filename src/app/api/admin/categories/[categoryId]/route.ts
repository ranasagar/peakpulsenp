
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient'; // Import both
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

// GET a single category (Admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const clientForRead = supabaseAdmin || fallbackSupabase; 

  if (!clientForRead) {
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }
  if (!isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Invalid Category ID format.' }, { status: 400 });
  }

  try {
    const { data, error } = await clientForRead
      .from('categories')
      .select('*, parent_id, "displayOrder"')
      .eq('id', categoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
      }
      return NextResponse.json({ 
        message: `Database error: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    if (!data) { 
      return NextResponse.json({ message: 'Category not found (no data returned)' }, { status: 404 });
    }

    const responseCategory: AdminCategory = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      imageUrl: data.image_url,
      aiImagePrompt: data.ai_image_prompt,
      parentId: data.parent_id,
      displayOrder: data.displayOrder,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
    };
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}


// PUT (Update) an existing category (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabaseService = supabaseAdmin; 
  const publicClient = fallbackSupabase;

  let clientToUse = supabaseService;
  let usingAdmin = true;

  if (!supabaseService) {
    console.warn(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase Service Role Client (supabaseAdmin) is not initialized. Falling back to public client. This will be subject to RLS for the user making the request.`);
    clientToUse = publicClient;
    usingAdmin = false;
    if (!clientToUse) {
      return NextResponse.json({ message: 'Database client not configured for write operations.', rawSupabaseError: { message: 'Both admin and public Supabase clients are unavailable.' } }, { status: 503 });
    }
  }

  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }
   if (!isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Invalid Category ID format for update.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json() as Partial<AdminCategory>;
  } catch (jsonError: any) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Error parsing request JSON:`, jsonError);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received body:`, body);

  const categoryToUpdate: { [key: string]: any } = {};

  if (body.name !== undefined) {
    categoryToUpdate.name = body.name.trim() || `Untitled Category ${Date.now()}`;
  }
  if (body.slug !== undefined) {
    if (body.slug.trim()) {
        categoryToUpdate.slug = body.slug.trim();
    } else if (categoryToUpdate.name) { // if name was also updated and slug is now empty, regenerate
        categoryToUpdate.slug = categoryToUpdate.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
  } else if (categoryToUpdate.name) { // if only name is updated, regenerate slug
      categoryToUpdate.slug = categoryToUpdate.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }


  if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
  if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null;
  if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null;
  if (body.hasOwnProperty('parentId')) {
    categoryToUpdate.parent_id = (body.parentId === '' || body.parentId === undefined || body.parentId === NO_PARENT_ID_VALUE) ? null : body.parentId;
  }
  if (body.displayOrder !== undefined) {
    categoryToUpdate["displayOrder"] = Number(body.displayOrder) || 0;
  }
  // Database trigger handles "updatedAt"

  if (Object.keys(categoryToUpdate).length === 0) {
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] No valid fields to update.`);
    return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
  }
  console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Attempting to update with payload:`, categoryToUpdate);

  try {
    const { data: updatedData, error } = await clientToUse
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select('*, parent_id, "displayOrder"')
      .single();

    if (error) {
      console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase error updating category:`, error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Category not found for update.', rawSupabaseError: error }, { status: 404 });
      }
      return NextResponse.json({ 
        message: `Database error updating category: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    if (!updatedData) {
        return NextResponse.json({ message: 'Category not found after update attempt (no data returned).' }, { status: 404 });
    }
    
    const responseCategory: AdminCategory = {
      id: updatedData.id,
      name: updatedData.name,
      slug: updatedData.slug,
      description: updatedData.description,
      imageUrl: updatedData.image_url,
      aiImagePrompt: updatedData.ai_image_prompt,
      parentId: updatedData.parent_id,
      displayOrder: updatedData.displayOrder,
      createdAt: updatedData.createdAt || updatedData.created_at,
      updatedAt: updatedData.updatedAt || updatedData.updated_at,
    };
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Unhandled error during category update:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred during category update." }, { status: 500 });
  }
}

// DELETE an existing category (Admin)
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const clientForWrite = supabaseAdmin || fallbackSupabase;

  if (!clientForWrite) {
    console.error('[API ADMIN CATEGORY DELETE] Supabase client not configured.');
    return NextResponse.json({ 
        message: 'Database client not configured. Cannot delete category.',
        rawSupabaseError: { message: 'Supabase client not initialized.' }
    }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }
   if (!isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Invalid Category ID format for delete.' }, { status: 400 });
  }

  try {
    // Check if category is used by any products using RPC
    const { data: rpcData, error: rpcError } = await clientForWrite.rpc('is_category_used_in_products', {
      p_category_id: categoryId,
    });

    if (rpcError) {
      console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Error calling RPC is_category_used_in_products:`, rpcError);
      return NextResponse.json({ 
        message: `Database error checking product associations: ${rpcError.message}`,
        rawSupabaseError: rpcError 
      }, { status: 500 });
    }

    if (rpcData === true) {
      return NextResponse.json({ 
        message: 'Cannot delete category: It is currently associated with one or more products. Please remove it from products first.',
      }, { status: 409 }); // 409 Conflict
    }

    // If not used, proceed with deletion
    const { error: deleteError } = await clientForWrite
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Supabase error deleting category:`, deleteError);
      return NextResponse.json({ 
        message: `Database error deleting category: ${deleteError.message}`, 
        rawSupabaseError: deleteError
      }, { status: 500 });
    }
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: `Failed to delete category: ${e.message}` }, { status: 500 });
  }
}
