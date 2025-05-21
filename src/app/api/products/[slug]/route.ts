
// /src/app/api/products/[slug]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Using relative path
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  console.log(`[API /api/products/[slug]] GET request for slug: ${slug}`);

  if (!supabase) {
    console.error('[API /api/products/[slug]] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }

  if (!slug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for "Fetched result consists of 0 rows"
        console.warn(`[API /api/products/[slug]] Product not found in Supabase for slug ${slug}. Error: ${error.message}`);
        return NextResponse.json({ message: `Product with slug '${slug}' not found.` }, { status: 404 });
      }
      console.error(`[API /api/products/[slug]] Supabase query error for slug ${slug}:`, error);
      return NextResponse.json({ message: 'Error fetching product from database.', rawSupabaseError: error }, { status: 500 });
    }

    if (product) {
      console.log(`[API /api/products/[slug]] Product found for slug ${slug}:`, product.name);
      return NextResponse.json(product);
    } else {
      // This case should ideally be caught by PGRST116, but as a fallback:
      console.warn(`[API /api/products/[slug]] Product not found for slug ${slug} (product was null after query).`);
      return NextResponse.json({ message: `Product with slug '${slug}' not found.` }, { status: 404 });
    }
  } catch (e) {
    console.error(`[API /api/products/[slug]] Unhandled error for slug ${slug}:`, e);
    return NextResponse.json({ message: 'Unexpected server error fetching product.', error: (e as Error).message }, { status: 500 });
  }
}
