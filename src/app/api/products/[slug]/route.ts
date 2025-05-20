
// /src/app/api/products/[slug]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  console.log(`[API /api/products/[slug]] GET request for slug: ${slug}`);

  if (!slug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single(); // Use single() as slug should be unique

    if (error) {
      if (error.code === 'PGRST116') { // Code for "JSON object requested, but array found" (no rows)
        console.warn(`[API /api/products/[slug]] Product not found in Supabase for slug ${slug}. Supabase error:`, error);
        return NextResponse.json({ message: `Product with slug '${slug}' not found.` }, { status: 404 });
      }
      console.error(`[API /api/products/[slug]] Supabase error fetching product for slug ${slug}:`, error);
      return NextResponse.json({ message: 'Error fetching product from Supabase.', error: error.message, details: error.details }, { status: 500 });
    }

    if (!data) {
      console.warn(`[API /api/products/[slug]] Product data is null for slug ${slug}, though no Supabase error.`);
      return NextResponse.json({ message: `Product with slug '${slug}' not found (data was null).` }, { status: 404 });
    }

    console.log(`[API /api/products/[slug]] Supabase query result for slug ${slug}:`, data);
    return NextResponse.json(data as Product);

  } catch (error) {
    console.error(`[API /api/products/[slug]] Unhandled error for slug ${slug}:`, error);
    return NextResponse.json({ message: 'Internal server error.', error: (error as Error).message }, { status: 500 });
  }
}
