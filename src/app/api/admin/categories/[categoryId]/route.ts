// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts';
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

const NO_PARENT_ID_VALUE = "__NONE__";

function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

export async function GET(
  request: NextRequest,
  { params: routeParams }: { params: { categoryId: string } } // Renamed to avoid conflict
) {
  const { categoryId } = routeParams; // Use destructured routeParams
  const clientForRead = supabaseAdmin || fallbackSupabase;

  if (!clientForRead) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Supabase client not configured.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!categoryId || !isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Valid Category ID is required.' }, { status: 400 });
  }
  
  try {
    const { data, error } = await clientForRead
      .from('categories')
      .select('*, parent_id, "displayOrder", created_at, updated_at') // Explicitly select timestamp columns
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
      createdAt: data.created_at, // Map from Supabase column
      updatedAt: data.updated_at, // Map from Supabase column
    };
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API ADMIN CATEGORY GET /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params: routeParams }: { params: { categoryId: string } } // Renamed
) {
  const { categoryId } = routeParams; // Use destructured routeParams
  const clientToUse = supabaseAdmin;

  if (!clientToUse) {
    console.error(`[API ADMIN CATEGORY PUT /${categoryId}] CRITICAL: Supabase ADMIN client not initialized.`);
    return NextResponse.json({
      message: 'Database admin client not configured. Service role key might be missing.',
      rawSupabaseError: { message: `Admin database client not available for updating category ${categoryId}.` }
    }, { status: 503 });
  }

  if (!categoryId || !isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Valid Category ID is required for update.' }, { status: 400 });
  }

  let body: Partial<AdminCategory>;
  try {
    body = await request.json();
  } catch (jsonError: any) {
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  
  const categoryToUpdate: { [key: string]: any } = {};

  if (body.name !== undefined) {
    const trimmedName = body.name.trim();
    if (!trimmedName) return NextResponse.json({ message: "Category name cannot be empty." }, { status: 400 });
    categoryToUpdate.name = trimmedName;
  }

  if (body.slug !== undefined) {
    if (body.slug.trim() === '') {
      const nameToSlugify = categoryToUpdate.name || body.name; 
      if (nameToSlugify && nameToSlugify.trim() !== '') {
        categoryToUpdate.slug = nameToSlugify.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      }
    } else {
      categoryToUpdate.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
  } else if (categoryToUpdate.name) { 
      categoryToUpdate.slug = categoryToUpdate.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  } else if (body.name && body.name.trim() !== '') { 
      categoryToUpdate.slug = body.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
  if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null;
  if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null;

  if (body.hasOwnProperty('parentId')) {
    categoryToUpdate.parent_id = body.parentId === NO_PARENT_ID_VALUE || body.parentId === '' ? null : body.parentId;
    if (categoryToUpdate.parent_id !== null && !isValidUUID(categoryToUpdate.parent_id)) {
        return NextResponse.json({ message: 'Invalid Parent ID format.' }, { status: 400 });
    }
  }
  if (body.displayOrder !== undefined) {
    categoryToUpdate["displayOrder"] = Number(body.displayOrder);
    if(isNaN(categoryToUpdate["displayOrder"])) categoryToUpdate["displayOrder"] = 0;
  }
  // Supabase trigger handles updated_at
  
  if (Object.keys(categoryToUpdate).length === 0) {
    try {
        const { data: currentData } = await clientToUse.from('categories').select('*, parent_id, "displayOrder", created_at, updated_at').eq('id', categoryId).single();
        if (!currentData) return NextResponse.json({ message: 'Category not found for no-op update.'}, { status: 404 });
        const responseCat: AdminCategory = { ...currentData, parentId: currentData.parent_id, imageUrl: currentData.image_url, aiImagePrompt: currentData.ai_image_prompt, displayOrder: currentData.displayOrder, createdAt: currentData.created_at, updatedAt: currentData.updated_at };
        return NextResponse.json(responseCat);
    } catch (e: any) {
        return NextResponse.json({ message: "No fields to update; error fetching current data.", rawSupabaseError: {message: e.message} }, { status: 400 });
    }
  }
  
  try {
    const { data: updatedData, error } = await clientToUse
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select('*, parent_id, "displayOrder", created_at, updated_at')
      .single();

    if (error) {
      const status = error.code === 'PGRST116' ? 404 : error.code === '23505' ? 409 : 500;
      const message = error.code === 'PGRST116' ? 'Category not found.' :
                      error.code === '23505' ? `Update conflict: ${error.details || ''}` :
                      `DB error: ${error.message}`;
      return NextResponse.json({ message, rawSupabaseError: error }, { status });
    }
    if (!updatedData) {
        return NextResponse.json({ message: 'Category not found after update.' }, { status: 404 });
    }
    const responseCategory: AdminCategory = { ...updatedData, parentId: updatedData.parent_id, imageUrl: updatedData.image_url, aiImagePrompt: updatedData.ai_image_prompt, displayOrder: updatedData.displayOrder, createdAt: updatedData.created_at, updatedAt: updatedData.updated_at };
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Update error.", rawSupabaseError: {message: e.message} }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params: routeParams }: { params: { categoryId: string } } // Renamed
) {
  const { categoryId } = routeParams; // Use destructured routeParams
  const clientForWrite = supabaseAdmin;

  if (!clientForWrite) {
    console.error(`[API ADMIN CATEGORY DELETE /${categoryId}] CRITICAL: Supabase ADMIN client not initialized.`);
    return NextResponse.json({ message: 'Database admin client not configured.', rawSupabaseError: { message: 'Admin Supabase client not available.' }}, { status: 503 });
  }
  if (!categoryId || !isValidUUID(categoryId)) {
    return NextResponse.json({ message: 'Valid Category ID required for delete.' }, { status: 400 });
  }
  
  try {
    const { data: rpcData, error: rpcError } = await clientForWrite.rpc('is_category_used_in_products', { p_category_id: categoryId });
    if (rpcError) {
      return NextResponse.json({ message: `DB error checking product links: ${rpcError.message}`, rawSupabaseError: rpcError }, { status: 500 });
    }
    if (rpcData === true) {
      return NextResponse.json({ message: 'Cannot delete: Category is linked to products.' }, { status: 409 });
    }

    const { error: deleteError } = await clientForWrite.from('categories').delete().eq('id', categoryId);
    if (deleteError) {
      return NextResponse.json({ message: `DB error deleting: ${deleteError.message}`, rawSupabaseError: deleteError }, { status: 500 });
    }
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: `Delete error: ${e.message}` }, { status: 500 });
  }
}

    