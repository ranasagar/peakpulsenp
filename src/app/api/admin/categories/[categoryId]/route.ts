
// /src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts';
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// PUT (Update) a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  console.log(`[API /api/admin/categories/${categoryId}] PUT request received.`);

  if (!supabase) {
    console.error(`[API /api/admin/categories/${categoryId} PUT] Supabase client is not initialized. Check environment variables and server restart.`);
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }
  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<Omit<AdminCategory, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const categoryToUpdate: { [key: string]: any } = {};
    if (body.name) categoryToUpdate.name = body.name;
    if (body.slug) categoryToUpdate.slug = body.slug;
    else if (body.name) categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('imageUrl')) categoryToUpdate.image_url = body.imageUrl || null; // Supabase uses image_url
    if (body.hasOwnProperty('aiImagePrompt')) categoryToUpdate.ai_image_prompt = body.aiImagePrompt || null; // Supabase uses ai_image_prompt
    
    categoryToUpdate.updated_at = new Date().toISOString(); // Explicitly set for Supabase if trigger isn't used/reliable

    console.log(`[API /api/admin/categories/${categoryId}] Attempting to update category with:`, categoryToUpdate);

    const { data, error } = await supabase
      .from('categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error(`[API /api/admin/categories/${categoryId}] Supabase error updating category:`, error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code, rawSupabaseError: error }, { status: 400 });
    }
    if (!data) {
        return NextResponse.json({ message: 'Category not found or update failed' }, { status: 404 });
    }
    console.log(`[API /api/admin/categories/${categoryId}] Category updated successfully:`, data);
    return NextResponse.json(data);
  } catch (e) {
    console.error(`[API /api/admin/categories/${categoryId}] Unhandled error updating category:`, e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

// DELETE a category
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  console.log(`[API /api/admin/categories/${categoryId}] DELETE request received.`);

  if (!supabase) {
    console.error(`[API /api/admin/categories/${categoryId} DELETE] Supabase client is not initialized. Check environment variables and server restart.`);
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
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
      console.error(`[API /api/admin/categories/${categoryId}] Supabase error deleting category:`, error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, rawSupabaseError: error }, { status: 500 });
    }
    console.log(`[API /api/admin/categories/${categoryId}] Category deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e) {
    console.error(`[API /api/admin/categories/${categoryId}] Unhandled error deleting category:`, e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
