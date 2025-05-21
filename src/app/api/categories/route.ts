
// /src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts'; 
import type { AdminCategory as Category } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("[API /api/categories] GET request received for frontend categories.");
  if (!supabase) {
    console.error('[API /api/categories] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, ai_image_prompt') 
      .order('name', { ascending: true });

    if (error) {
      console.error('[API /api/categories] Supabase error fetching categories:', error);
      return NextResponse.json({ message: 'Failed to fetch categories from database.', rawSupabaseError: error }, { status: 500 });
    }

    const categories: Category[] = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.image_url,
        aiImagePrompt: c.ai_image_prompt,
        // Ensure createdAt and updatedAt are not expected by AdminCategory if not selected
    }));

    console.log(`[API /api/categories] Successfully fetched ${categories.length} categories.`);
    return NextResponse.json(categories);
  } catch (e) {
    console.error('[API /api/categories] Unhandled error fetching categories:', e);
    return NextResponse.json({ message: 'Error fetching categories.', error: (e as Error).message }, { status: 500 });
  }
}
