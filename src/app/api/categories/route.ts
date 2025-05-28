
// /src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts'; 
import type { AdminCategory as Category } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabase) {
    console.error('[API /api/categories] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, ai_image_prompt, parent_id, "displayOrder"') 
      .order('"displayOrder"', { ascending: true, nullsLast: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[API /api/categories] Supabase error fetching categories:', error);
      return NextResponse.json({ 
        message: 'Failed to fetch categories from database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }

    const categories: Category[] = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.image_url,
        aiImagePrompt: c.ai_image_prompt,
        parentId: c.parent_id,
        displayOrder: c.displayOrder,
        createdAt: c.createdAt || c.created_at,
        updatedAt: c.updatedAt || c.updated_at,
    }));

    return NextResponse.json(categories);
  } catch (e: any) {
    console.error('[API /api/categories] Unhandled error fetching categories:', e);
    return NextResponse.json({ message: 'Error fetching categories.', errorDetails: e.message }, { status: 500 });
  }
}
