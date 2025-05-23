
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
  const supabase = supabaseAdmin; 

  if (!supabase) {
    console.error(`[API /api/admin/categories/${categoryId} GET] Supabase admin client is not initialized.`);
    return NextResponse.json({ message: 'Database admin client not configured.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*') // Select all columns including parent_id
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
    console.error(`[API /api/admin/categories/${categoryId} GET] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "Failed to fetch category." }, { status: 500 });
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
    return NextResponse.json({ message: 'Database admin client not configured.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<Omit<AdminCategory, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const categoryToUpdate: { [key: string]: any } = {};
    if (body.name !== undefined) categoryToUpdate.name = body.name;
    
    if (body.name !== undefined && (!body.slug || body.slug.trim() === '')) {
      categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    } else if (body.slug !== undefined) {
      categoryToUpdate.slug = body.slug;
    }
    
    // Handle optional fields, setting to null if empty string to clear them
    if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null;
    if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null;
    
    if (body.hasOwnProperty('parentId')) {
        categoryToUpdate.parent_id = body.parentId === '' || body.parentId === undefined ? null : body.parentId;
    }
    
    // Do NOT explicitly set "updatedAt" here. Let the database trigger handle it.
    // categoryToUpdate["updatedAt"] = new Date().toISOString(); // REMOVED THIS LINE

    console.log(`[API /api/admin/categories/${categoryId}] Attempting to update category with:`, categoryToUpdate);

    const { data: updatedData, error } = await supabase
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select('*') // Re-fetch all columns including parent_id and trigger-updated "updatedAt"
      .single();

    if (error) {
      console.error(`[API /api/admin/categories/${categoryId} PUT] Supabase error updating category:`, JSON.stringify(error, null, 2));
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code, rawSupabaseError: error }, { status: 400 });
    }
    if (!updatedData) {
        return NextResponse.json({ message: 'Category not found or update failed' }, { status: 404 });
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
    
    console.log(`[API /api/admin/categories/${categoryId}] Category updated successfully:`, responseCategory);
    return NextResponse.json(responseCategory);
  } catch (e: any) {
    console.error(`[API /api/admin/categories/${categoryId} PUT] Unhandled error updating category:`, e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ message: "Failed to update category. " + errorMessage, errorDetails: e }, { status: 500 });
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
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ message: "Failed to delete category. " + errorMessage, errorDetails: e }, { status: 500 });
  }
}
