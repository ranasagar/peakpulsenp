
// /src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path
import type { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // For checking if ID is UUID

// Helper to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

export async function GET() {
  console.log("[API /api/admin/products] GET request received.");
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /api/admin/products] Supabase error fetching products:', error);
      return NextResponse.json(
        { message: 'Error fetching products for admin', error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }
    return NextResponse.json(data as Product[]);
  } catch (error) {
    console.error('[API /api/admin/products] Unhandled error in GET handler:', error);
    return NextResponse.json({ message: 'Error fetching products for admin', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("[API /api/admin/products] POST request received.");
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn("[API /api/admin/products] Product modification is disabled in Vercel production environment for this demo.");
    return NextResponse.json({ message: 'Product modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const productData = (await request.json()) as Product;
    console.log("[API /api/admin/products] Received product data for save/update:", JSON.stringify(productData, null, 2));

    const { id, slug: providedSlug, name, ...restOfProductData } = productData;

    const slug = providedSlug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    console.log(`[API /api/admin/products] Slug being processed: ${slug}`);

    // Sanitize optional numeric fields
    const sanitizedData = {
      ...restOfProductData,
      name, // ensure name is included
      slug, // ensure slug is included
      compareAtPrice: isNaN(Number(restOfProductData.compareAtPrice)) || restOfProductData.compareAtPrice === undefined ? null : Number(restOfProductData.compareAtPrice),
      costPrice: isNaN(Number(restOfProductData.costPrice)) || restOfProductData.costPrice === undefined ? null : Number(restOfProductData.costPrice),
      stock: isNaN(Number(restOfProductData.stock)) || restOfProductData.stock === undefined ? 0 : Number(restOfProductData.stock),
      variants: (restOfProductData.variants || []).map(variant => ({
        ...variant,
        price: isNaN(Number(variant.price)) ? 0 : Number(variant.price),
        costPrice: isNaN(Number(variant.costPrice)) || variant.costPrice === undefined ? null : Number(variant.costPrice),
        stock: isNaN(Number(variant.stock)) ? 0 : Number(variant.stock),
      })),
      updatedAt: new Date().toISOString(),
    };

    let savedProduct;
    let operationError;

    if (id && isValidUUID(id)) {
      console.log(`[API /api/admin/products] Attempting to UPDATE product with ID: ${id}`);
      const { data, error } = await supabase
        .from('products')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single();
      savedProduct = data;
      operationError = error;
    } else {
      console.log(`[API /api/admin/products] Attempting to INSERT new product (client-generated ID was: ${id})`);
      // Do not pass the client-generated 'prod-...' ID to Supabase for insert
      const { createdAt, ...dataForInsert } = sanitizedData; // Supabase handles createdAt
      const { data, error } = await supabase
        .from('products')
        .insert(dataForInsert)
        .select()
        .single();
      savedProduct = data;
      operationError = error;
    }

    if (operationError) {
      console.error('[API /api/admin/products] Supabase error saving product:', operationError);
      return NextResponse.json({ message: 'Error saving product to Supabase.', error: operationError.message, details: operationError.details }, { status: 500 });
    }

    if (!savedProduct) {
      console.error('[API /api/admin/products] Product was not saved/returned after Supabase operation, but no explicit error.');
      return NextResponse.json({ message: 'Product operation completed but no product data returned from Supabase.'}, { status: 500 });
    }
    
    console.log("[API /api/admin/products] Product saved successfully to Supabase:", savedProduct);
    return NextResponse.json({ message: 'Product saved successfully.', product: savedProduct });

  } catch (error) {
    console.error('[API /api/admin/products] Unhandled error in POST handler:', error);
    return NextResponse.json({ message: 'Error processing product save request.', error: (error as Error).message }, { status: 500 });
  }
}
