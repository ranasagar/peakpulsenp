
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseClient.ts'; // Use admin for writes
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single category (not typically used by the admin page which fetches all)
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabase = supabaseAdmin; // Use admin client for consistency if needed, or public for reads

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
      console.error(`[API /api/admin/categories/${categoryId} GET] Supabase error:`, error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code, rawSupabaseError: error }, { status: 500 });
    }
     if (!data) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    const responseCategory: AdminCategory = {
      ...data,
      imageUrl: data.image_url,
      aiImagePrompt: data.ai_image_prompt,
      parentId: data.parent_id,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
    };
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API /api/admin/categories/${categoryId} GET] Unhandled error:`, e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}


// PUT (Update) an existing category
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  console.log(`[API /api/admin/categories/${categoryId}] PUT request received.`);
  const supabase = supabaseAdmin;

  if (!supabase) {
    console.error(`[API /api/admin/categories/${categoryId} PUT] Supabase admin client is not initialized.`);
    return NextResponse.json({ message: 'Database admin client not configured. Check server logs and .env file for SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<Omit<AdminCategory, 'id' | 'createdAt' | 'updatedAt'>>;
    
    // Prepare the object for Supabase, ensuring correct snake_case for DB columns
    const categoryToUpdate: { [key: string]: any } = {};
    if (body.name !== undefined) categoryToUpdate.name = body.name;
    
    // Auto-generate slug if name is provided and slug is not, or if slug is empty
    if (body.name !== undefined && (!body.slug || body.slug.trim() === '')) {
      categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    } else if (body.slug !== undefined) {
      categoryToUpdate.slug = body.slug;
    }
    
    if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null;
    if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null;
    
    // Handle parentId: if an empty string comes from form for "None", convert to null for DB
    if (body.hasOwnProperty('parentId')) {
        categoryToUpdate.parent_id = body.parentId === '' ? null : body.parentId;
    }
    
    // Explicitly set "updatedAt" to ensure it matches the expected column name by the trigger
    categoryToUpdate["updatedAt"] = new Date().toISOString(); // Use camelCase for the payload key

    console.log(`[API /api/admin/categories/${categoryId}] Attempting to update category with:`, categoryToUpdate);

    const { data: updatedData, error } = await supabase
      .from('categories')
      .update(categoryToUpdate) // This sends the payload with "updatedAt"
      .eq('id', categoryId)
      .select('*, parent_id') // Re-fetch parent_id
      .single();

    if (error) {
      console.error(`[API /api/admin/categories/${categoryId} PUT] Supabase error updating category:`, JSON.stringify(error, null, 2));
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code, rawSupabaseError: error }, { status: 400 });
    }
    if (!updatedData) {
        return NextResponse.json({ message: 'Category not found or update failed' }, { status: 404 });
    }

    // Map back to AdminCategory type for the response
    const responseCategory: AdminCategory = {
      id: updatedData.id,
      name: updatedData.name,
      slug: updatedData.slug,
      description: updatedData.description,
      imageUrl: updatedData.image_url,
      aiImagePrompt: updatedData.ai_image_prompt,
      parentId: updatedData.parent_id,
      createdAt: updatedData.createdAt || updatedData.created_at, // Handle potential casing from DB
      updatedAt: updatedData.updatedAt || updatedData.updated_at, // Handle potential casing from DB
    };
    
    console.log(`[API /api/admin/categories/${categoryId}] Category updated successfully:`, responseCategory);
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API /api/admin/categories/${categoryId} PUT] Unhandled error updating category:`, e);
    return NextResponse.json({ message: "Failed to update category. " + (e as Error).message }, { status: 500 });
  }
}

// DELETE an existing category
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  console.log(`[API /api/admin/categories/${categoryId}] DELETE request received.`);
  const supabase = supabaseAdmin;

  if (!supabase) {
    console.error(`[API /api/admin/categories/${categoryId} DELETE] Supabase admin client is not initialized.`);
    return NextResponse.json({ message: 'Database admin client not configured.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    // The ON DELETE SET NULL for parent_id in the DB schema handles children.
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error(`[API /api/admin/categories/${categoryId} DELETE] Supabase error deleting category:`, JSON.stringify(error, null, 2));
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, rawSupabaseError: error }, { status: 500 });
    }
    console.log(`[API /api/admin/categories/${categoryId}] Category deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e: any) {
    console.error(`[API /api/admin/categories/${categoryId} DELETE] Unhandled error deleting category:`, e);
    return NextResponse.json({ message: "Failed to delete category. " + (e as Error).message }, { status: 500 });
  }
}
