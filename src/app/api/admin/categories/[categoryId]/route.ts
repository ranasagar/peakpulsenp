
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts'; // Adjusted path
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single category (Admin) - No changes needed here for this issue
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const clientForRead = supabaseAdmin || fallbackSupabase; 
  
  // console.log(`[API ADMIN CATEGORY GET /${categoryId}] Request received. Using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);

  if (!clientForRead) {
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await clientForRead
      .from('categories')
      .select('*, parent_id') // Ensure parent_id is selected if needed for mapping
      .eq('id', categoryId)
      .single();

    if (error) {
      console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase error fetching category:`, error);
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
      parentId: data.parent_id, // Map parent_id from db to parentId
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
    };
    // console.log(`[API ADMIN CATEGORY GET /${categoryId}] Category fetched successfully:`, responseCategory.name);
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

  if (!supabaseService) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] CRITICAL: Supabase Service Role Client (supabaseAdmin) is not initialized.`);
    return NextResponse.json({
      message: 'Database admin client not configured for write operations. Service role key might be missing.',
      rawSupabaseError: { message: `Admin database client (service_role) not available for updating category ${categoryId}.` }
    }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json() as Partial<AdminCategory>;
  } catch (jsonError: any) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Error parsing request JSON:`, jsonError);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  // console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Received body:`, body);

  const categoryToUpdate: { [key: string]: any } = {};

  if (body.name !== undefined) categoryToUpdate.name = body.name;

  if (body.slug !== undefined && body.slug.trim() !== '') {
    categoryToUpdate.slug = body.slug.trim();
  } else if (body.name !== undefined && body.name.trim() !== '') { 
    categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  
  if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
  if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null;
  if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null;
  if (body.hasOwnProperty('parentId')) {
    categoryToUpdate.parent_id = (body.parentId === '' || body.parentId === undefined) ? null : body.parentId;
  }
  // The trigger handles "updatedAt"
  // categoryToUpdate["updatedAt"] = new Date().toISOString();


  if (Object.keys(categoryToUpdate).length === 0) {
    console.log(`[API ADMIN CATEGORY PUT /${categoryId}] No fields to update.`);
    // Fetch and return current data if no changes
    const { data: currentData, error: fetchError } = await supabaseService.from('categories').select('*, parent_id').eq('id', categoryId).single();
      if (fetchError || !currentData) {
        const message = fetchError ? fetchError.message : 'Category not found after no-op update.';
        return NextResponse.json({ message, rawSupabaseError: fetchError }, { status: fetchError && fetchError.code === 'PGRST116' ? 404 : 500 });
      }
      return NextResponse.json({
        id: currentData.id, name: currentData.name, slug: currentData.slug, description: currentData.description,
        imageUrl: currentData.image_url, aiImagePrompt: currentData.ai_image_prompt, parentId: currentData.parent_id,
        createdAt: currentData.createdAt || currentData.created_at, updatedAt: currentData.updatedAt || currentData.updated_at,
      });
  }
  // console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Payload to Supabase:`, categoryToUpdate);

  try {
    const { data: updatedData, error } = await supabaseService
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select('*, parent_id')
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
        return NextResponse.json({ message: 'Category not found after update attempt.' }, { status: 404 });
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
    // console.log(`[API ADMIN CATEGORY PUT /${categoryId}] Category updated successfully.`);
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred during category update." }, { status: 500 });
  }
}

// DELETE an existing category (Admin)
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const clientForWrite = supabaseAdmin;

  // console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Received request.`);

  if (!clientForWrite) {
    console.error('[API ADMIN CATEGORY DELETE] CRITICAL: Admin Supabase client (service_role) is not initialized.');
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot delete category.',
        rawSupabaseError: { message: 'Admin Supabase client not initialized.' }
    }, { status: 503 });
  }
  // console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Using ADMIN client (service_role).`);

  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    // Check if category is a parent to any other categories
    const { data: childCategories, error: childCheckError } = await clientForWrite
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', categoryId)
      .limit(1);

    if (childCheckError) {
      console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Error checking for child categories:`, childCheckError);
      return NextResponse.json({ 
        message: `Database error checking for children: ${childCheckError.message}`,
        rawSupabaseError: childCheckError 
      }, { status: 500 });
    }

    if (childCategories && childCategories.length > 0) { // This check was wrong, count is on data directly
      return NextResponse.json({ 
        message: 'Cannot delete category: It is a parent to other categories. Please reassign or delete child categories first.',
      }, { status: 409 }); // 409 Conflict
    }
    // Correct check if using count:
    if (childCheckError === null && childCategories !== null && typeof (childCategories as any).count === 'number' && (childCategories as any).count > 0) {
        return NextResponse.json({ 
            message: 'Cannot delete category: It is a parent to other categories. Please reassign or delete child categories first.',
        }, { status: 409 });
    }


    // Check if category is used by any products using RPC
    const { data: rpcData, error: rpcError } = await clientForWrite.rpc('is_category_used_in_products', {
      p_category_id: categoryId,
    });

    if (rpcError) {
      console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Error calling RPC is_category_used_in_products:`, rpcError);
      return NextResponse.json({ 
        message: `Database error checking product associations via RPC: ${rpcError.message}`,
        rawSupabaseError: rpcError 
      }, { status: 500 });
    }

    if (rpcData === true) { // rpcData will be the boolean returned by the function
      return NextResponse.json({ 
        message: 'Cannot delete category: It is currently associated with one or more products. Please remove it from products first.',
      }, { status: 409 }); // 409 Conflict
    }

    // If not used and not a parent, proceed with deletion
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
    // console.log(`[API ADMIN CATEGORY DELETE /${categoryId}] Category deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: `Failed to delete category: ${e.message}` }, { status: 500 });
  }
}
    