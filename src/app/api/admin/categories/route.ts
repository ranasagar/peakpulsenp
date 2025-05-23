
// /src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient'; // Adjusted path
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET all categories
export async function GET() {
  console.log("[API /api/admin/categories] GET request received.");
  if (!supabase) {
    console.error('[API /api/admin/categories GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent_id') // Ensure parent_id is selected
      .order('name', { ascending: true });

    if (error) {
      console.error('[API /api/admin/categories] Supabase error fetching categories:', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, rawSupabaseError: error }, { status: 500 });
    }
    
    // Map Supabase snake_case to camelCase for the client
    const categories = data?.map(cat => ({
      ...cat,
      imageUrl: cat.image_url,
      aiImagePrompt: cat.ai_image_prompt,
      parentId: cat.parent_id,
      createdAt: cat.createdAt || cat.created_at, // Handle both casing possibilities
      updatedAt: cat.updatedAt || cat.updated_at,
    })) || [];
    
    console.log(`[API /api/admin/categories] Successfully fetched ${categories.length} categories.`);
    return NextResponse.json(categories);
  } catch (e: any) {
    console.error('[API /api/admin/categories] Unhandled error fetching categories:', e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

// POST a new category
export async function POST(request: NextRequest) {
  console.log("[API /api/admin/categories] POST request received.");
  if (!supabase) {
    console.error('[API /api/admin/categories POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  try {
    const body = await request.json() as Omit<AdminCategory, 'id' | 'createdAt' | 'updatedAt'>;
    
    const categoryToInsert = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.imageUrl || null,
      ai_image_prompt: body.aiImagePrompt || null,
      parent_id: body.parentId || null, // Save parentId as parent_id
    };
    console.log("[API /api/admin/categories] Attempting to insert category:", categoryToInsert);

    const { data: insertedData, error } = await supabase
      .from('categories')
      .insert(categoryToInsert)
      .select()
      .single();

    if (error) {
      console.error('[API /api/admin/categories] Supabase error creating category:', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code, rawSupabaseError: error }, { status: 400 });
    }

    const responseCategory = {
      ...insertedData,
      imageUrl: insertedData.image_url,
      aiImagePrompt: insertedData.ai_image_prompt,
      parentId: insertedData.parent_id,
      createdAt: insertedData.createdAt || insertedData.created_at,
      updatedAt: insertedData.updatedAt || insertedData.updated_at,
    };

    console.log("[API /api/admin/categories] Category created successfully:", responseCategory);
    return NextResponse.json(responseCategory, { status: 201 });
  } catch (e: any) {
    console.error('[API /api/admin/categories] Unhandled error creating category:', e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
