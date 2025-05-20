
// /src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path
import type { Product } from '@/types';
import { v4 as uuidv4, validate as isValidUUID } from 'uuid';


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

    const { id: clientProvidedId, slug: providedSlug, name, ...restOfProductData } = productData;

    const slug = providedSlug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    console.log(`[API /api/admin/products] Slug being processed: ${slug}`);

    // Sanitize optional numeric fields and ensure arrays are properly formatted
    const sanitizedData = {
      ...restOfProductData,
      name, 
      slug, 
      price: Number(restOfProductData.price) || 0,
      compareAtPrice: (restOfProductData.compareAtPrice === undefined || isNaN(Number(restOfProductData.compareAtPrice))) ? null : Number(restOfProductData.compareAtPrice),
      costPrice: (restOfProductData.costPrice === undefined || isNaN(Number(restOfProductData.costPrice))) ? null : Number(restOfProductData.costPrice),
      stock: (restOfProductData.variants && restOfProductData.variants.length > 0) 
             ? restOfProductData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
             : (Number(restOfProductData.stock) || 0),
      images: Array.isArray(restOfProductData.images) ? restOfProductData.images : [],
      categories: Array.isArray(restOfProductData.categories) ? restOfProductData.categories : [],
      variants: (Array.isArray(restOfProductData.variants) ? restOfProductData.variants : []).map(variant => ({
        ...variant,
        price: Number(variant.price) || 0,
        costPrice: (variant.costPrice === undefined || isNaN(Number(variant.costPrice))) ? null : Number(variant.costPrice),
        stock: Number(variant.stock) || 0,
      })),
      availablePrintDesigns: Array.isArray(restOfProductData.availablePrintDesigns) ? restOfProductData.availablePrintDesigns : null, // Use null if not provided/empty
      customizationConfig: restOfProductData.customizationConfig || null, // Use null if not provided
      updatedAt: new Date().toISOString(),
    };

    let savedProduct;
    let operationError;

    if (clientProvidedId && isValidUUID(clientProvidedId)) {
      console.log(`[API /api/admin/products] Attempting to UPDATE product with ID: ${clientProvidedId}`);
      const { data, error } = await supabase
        .from('products')
        .update(sanitizedData)
        .eq('id', clientProvidedId)
        .select()
        .single();
      savedProduct = data;
      operationError = error;
    } else {
      // For insert, do not include 'id' if it's not a valid UUID, let Supabase generate it.
      // Also, createdAt is handled by DB default.
      const { createdAt, ...dataForInsert } = sanitizedData;
      console.log(`[API /api/admin/products] Attempting to INSERT new product. Client-provided ID was: ${clientProvidedId}`);
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
    return NextResponse.json(savedProduct); // Return only the saved product

  } catch (error) {
    console.error('[API /api/admin/products] Unhandled error in POST handler:', error);
    return NextResponse.json({ message: 'Error processing product save request.', error: (error as Error).message }, { status: 500 });
  }
}
