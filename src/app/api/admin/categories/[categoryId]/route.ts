
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts'; // Ensure this path is correct
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

const NO_PARENT_ID_VALUE = "__NONE__"; // Ensure this matches client-side constant if used for 'None' option

function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

// GET a single category (Admin) - Assumed to be working, no changes here for now.
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const clientForRead = supabaseAdmin || fallbackSupabase; 

  if (!clientForRead) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase client not configured.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }
  if (!isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Invalid Category ID format.' }, { status: 400 });
  }
  console.log(`[API ADMIN CATEGORY GET /${categoryId}] Fetching category. Using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);
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
      console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase error:`, error);
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
  const clientToUse = supabaseAdmin; // Strictly use admin client for updates

  if (!clientToUse) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Update operation cannot proceed. Check SUPABASE_SERVICE_ROLE_KEY environment variable and server restart.`);
    return NextResponse.json({
      message: 'Database admin client not configured for write operations. Service role key might be missing.',
      rawSupabaseError: { message: `Admin database client (service_role) not available for updating category ${categoryId}.` }
    }, { status: 503 });
  }

  if (!categoryId || !isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Valid Category ID is required for update.' }, { status: 400 });
  }

  let body: Partial<AdminCategory>;
  try {
    body = await request.json();
  } catch (jsonError: any) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Error parsing request JSON:`, jsonError);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received body:`, JSON.stringify(body));

  const categoryToUpdate: { [key: string]: any } = {};

  if (body.name !== undefined) {
    const trimmedName = body.name.trim();
    if (!trimmedName) return NextResponse.json({ message: "Category name cannot be empty." }, { status: 400 });
    categoryToUpdate.name = trimmedName;
  }

  if (body.slug !== undefined) {
    if (body.slug.trim() === '') { // If slug is explicitly emptied
      if (categoryToUpdate.name) { // And name is being changed, generate from new name
        categoryToUpdate.slug = categoryToUpdate.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      } else {
        // If name is not being changed but slug is emptied, this is problematic.
        // We might need to fetch the current name to regenerate or disallow emptying slug without changing name.
        // For now, if slug is empty and name not changed, we don't update slug.
        // If this behavior is desired, the client should send the current slug or not send the slug field.
      }
    } else {
      categoryToUpdate.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
  } else if (categoryToUpdate.name) { // If name is changed and slug is not provided, regenerate slug
      categoryToUpdate.slug = categoryToUpdate.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }


  if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
  if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null; // column name is image_url
  if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null; // column name is ai_image_prompt
  
  if (body.hasOwnProperty('parentId')) {
    // Client should send `null` if "None" is selected, or the actual parent UUID string.
    // The special value like NO_PARENT_ID_VALUE should be handled client-side before sending.
    categoryToUpdate.parent_id = body.parentId === NO_PARENT_ID_VALUE || body.parentId === '' ? null : body.parentId;
    if (categoryToUpdate.parent_id !== null && !isValidUUID(categoryToUpdate.parent_id)) {
        return NextResponse.json({ message: 'Invalid Parent ID format provided.' }, { status: 400 });
    }
  }
  if (body.displayOrder !== undefined) {
    categoryToUpdate["displayOrder"] = Number(body.displayOrder) || 0;
  }
  
  // The database trigger should handle "updatedAt" automatically.
  // We don't need to set it explicitly here.

  if (Object.keys(categoryToUpdate).length === 0) {
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] No valid fields to update.`);
    // Optionally, fetch and return current record if no changes, or return a specific message.
    // For now, returning a 304 might be confusing if the client expects updated data.
    // Let's return the current data to signify no effective change.
    try {
        const { data: currentData, error: fetchError } = await clientToUse
            .from('categories')
            .select('*, parent_id, "displayOrder"')
            .eq('id', categoryId)
            .single();
        if (fetchError) throw fetchError;
        if (!currentData) return NextResponse.json({ message: 'Category not found for no-op update.'}, { status: 404 });
        const responseCat = { ...currentData, parentId: currentData.parent_id, imageUrl: currentData.image_url, aiImagePrompt: currentData.ai_image_prompt, displayOrder: currentData.displayOrder };
        return NextResponse.json(responseCat);
    } catch (e) {
        return NextResponse.json({ message: "No fields to update and failed to fetch current data." }, { status: 400 });
    }
  }
  console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Attempting to update with payload:`, JSON.stringify(categoryToUpdate));

  try {
    const { data: updatedData, error } = await clientToUse
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select('*, parent_id, "displayOrder"') // Select all fields to return the updated record
      .single();

    if (error) {
      console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Supabase error updating category:`, error);
      let errorMessage = `Database error: ${error.message}`;
      if (error.code === 'PGRST116') { // Row not found
        return NextResponse.json({ message: 'Category not found for update.', rawSupabaseError: error }, { status: 404 });
      }
      if (error.code === '23505') { // Unique constraint violation (e.g. slug or name)
        errorMessage = `Failed to update category: A category with that name or slug already exists. ${error.details || ''}`;
      }
      return NextResponse.json({ 
        message: errorMessage, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: error.code === '23505' ? 409 : 500 }); // 409 for conflict
    }
    if (!updatedData) { // Should be caught by PGRST116, but as a fallback
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
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Category updated successfully.`);
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
  const clientForWrite = supabaseAdmin; // Strictly use admin client

  if (!clientForWrite) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] CRITICAL: Supabase ADMIN client (service_role) is not initialized.`);
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot delete category.',
        rawSupabaseError: { message: 'Admin Supabase client not available.' }
    }, { status: 503 });
  }
  if (!categoryId || !isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Valid Category ID is required for delete.' }, { status: 400 });
  }
  console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Attempting to delete category. Using ADMIN client.`);

  try {
    // Check if category is used by any products
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
      console.warn(`[API ADMIN CATEGORY DELETE /${categoryId}] Attempt to delete category that is in use.`);
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
    console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Category deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: `Failed to delete category: ${e.message}` }, { status: 500 });
  }
}
