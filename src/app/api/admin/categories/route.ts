
// /src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts';
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET all categories
export async function GET() {
  console.log("[API /api/admin/categories] GET request received.");
  if (!supabase) {
    return NextResponse.json({ message: 'Supabase client not initialized' }, { status: 503 });
  }
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[API /api/admin/categories] Supabase error fetching categories:', error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }
    console.log(`[API /api/admin/categories] Successfully fetched ${data?.length || 0} categories.`);
    return NextResponse.json(data);
  } catch (e) {
    console.error('[API /api/admin/categories] Unhandled error fetching categories:', e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

// POST a new category
export async function POST(request: NextRequest) {
  console.log("[API /api/admin/categories] POST request received.");
  if (!supabase) {
    return NextResponse.json({ message: 'Supabase client not initialized' }, { status: 503 });
  }
  try {
    const body = await request.json() as Omit<AdminCategory, 'id' | 'createdAt' | 'updatedAt'>;
    
    const categoryToInsert = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.imageUrl || null,
      ai_image_prompt: body.aiImagePrompt || null,
    };
    console.log("[API /api/admin/categories] Attempting to insert category:", categoryToInsert);

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryToInsert)
      .select()
      .single();

    if (error) {
      console.error('[API /api/admin/categories] Supabase error creating category:', error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code }, { status: 400 }); // 400 for bad user input / constraints
    }
    console.log("[API /api/admin/categories] Category created successfully:", data);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('[API /api/admin/categories] Unhandled error creating category:', e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
