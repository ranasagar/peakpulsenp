
// /src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient.ts';
import type { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

async function getProductsFromSupabase() {
  // Admin reads can also use public client if RLS is set up for admin role,
  // but for consistency or if needing to bypass RLS for some admin reads, service_role could be used.
  // For now, public client is fine for GET as RLS should allow admin reads.
  const clientForRead = supabaseAdmin || supabase; // Prefer admin for consistency if available
  if (!clientForRead) {
    console.error('[API /api/admin/products GET] Supabase client for read is not initialized.');
    throw new Error('Database client not configured for product reads.');
  }
  console.log(`[API /api/admin/products GET] Fetching products using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);
  const { data, error } = await clientForRead
    .from('products')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[API /api/admin/products GET] Supabase error fetching products:', error);
    throw error;
  }
  return data || [];
}

export async function GET() {
  console.log("[API /api/admin/products] GET request received for admin.");
  try {
    const products = await getProductsFromSupabase();
    console.log(`[API /api/admin/products] Fetched ${products.length} products for admin.`);
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('[API /api/admin/products GET] Error in GET handler:', error);
    return NextResponse.json({
      message: 'Error fetching products for admin.',
      error: error.message,
      rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
    }, { status: 500 });
  }
}

function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

export async function POST(request: NextRequest) {
  console.log("[API /api/admin/products] POST request received to save product.");
  const clientForWrite = supabaseAdmin; // Admin writes should use service_role key

  if (!clientForWrite) {
    console.error('[API /api/admin/products POST] CRITICAL: Admin Supabase client (service_role) is not initialized. Check SUPABASE_SERVICE_ROLE_KEY in .env and server restart.');
    return NextResponse.json({
        message: 'Database admin client not configured for write operations. Cannot save product.',
        rawSupabaseError: { message: 'Admin Supabase client for write operations not initialized.' }
    }, { status: 503 });
  }
  console.log(`[API /api/admin/products POST] Using ADMIN client (service_role).`);

  let productDataFromRequest: Partial<Product>;
  try {
    productDataFromRequest = (await request.json()) as Partial<Product>;
    console.log("[API /api/admin/products POST] Received product data for save/update:", JSON.stringify(productDataFromRequest, null, 2));
  } catch (e: any) {
    console.error('[API /api/admin/products POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', errorDetails: e.message }, { status: 400 });
  }

  const { id, name, slug, ...restOfProductData } = productDataFromRequest;

  if (!name) {
    return NextResponse.json({ message: 'Product name is required.' }, { status: 400 });
  }
  
  const finalSlug = slug?.trim() ? slug.trim() : name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  // Prepare data for Supabase, ensuring correct types and nulls
  // Omit 'id', 'createdAt', 'updatedAt' from the payload as DB handles them.
  const supabaseDataPayload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { slug: string } = {
    name,
    slug: finalSlug,
    price: Number(productDataFromRequest.price) || 0,
    compareAtPrice: productDataFromRequest.compareAtPrice != null ? Number(productDataFromRequest.compareAtPrice) : null,
    costPrice: productDataFromRequest.costPrice != null ? Number(productDataFromRequest.costPrice) : null,
    shortDescription: productDataFromRequest.shortDescription || null,
    description: productDataFromRequest.description || '',
    images: Array.isArray(productDataFromRequest.images) ? productDataFromRequest.images.map(img => ({ ...img, id: img.id || uuidv4() })) : [],
    categories: Array.isArray(productDataFromRequest.categories) ? productDataFromRequest.categories.map(cat => ({ ...cat, id: cat.id || uuidv4() })) : [],
    variants: (Array.isArray(productDataFromRequest.variants) ? productDataFromRequest.variants : []).map(variant => ({
      ...variant,
      id: variant.id || uuidv4(),
      price: Number(variant.price) || 0,
      costPrice: variant.costPrice != null ? Number(variant.costPrice) : null,
      stock: Number(variant.stock) || 0,
      imageId: variant.imageId || null
    })),
    stock: (productDataFromRequest.variants && productDataFromRequest.variants.length > 0)
           ? productDataFromRequest.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
           : (Number(productDataFromRequest.stock) || 0),
    availablePrintDesigns: Array.isArray(productDataFromRequest.availablePrintDesigns) ? productDataFromRequest.availablePrintDesigns.map(d => ({...d, id: d.id || uuidv4()})) : [],
    customizationConfig: productDataFromRequest.customizationConfig || null,
    collections: productDataFromRequest.collections || null,
    tags: productDataFromRequest.tags || null,
    fabricDetails: productDataFromRequest.fabricDetails || null,
    careInstructions: productDataFromRequest.careInstructions || null,
    sustainabilityMetrics: productDataFromRequest.sustainabilityMetrics || null,
    fitGuide: productDataFromRequest.fitGuide || null,
    sku: productDataFromRequest.sku || null,
    averageRating: Number(productDataFromRequest.averageRating) || 0,
    reviewCount: Number(productDataFromRequest.reviewCount) || 0,
    isFeatured: productDataFromRequest.isFeatured || false,
    reviews: productDataFromRequest.reviews || null,
  };

  // Explicitly set optional fields to null if they are empty strings or undefined, to avoid database errors
  for (const key in supabaseDataPayload) {
    if (supabaseDataPayload[key as keyof typeof supabaseDataPayload] === undefined) {
      (supabaseDataPayload as any)[key] = null;
    }
  }
  if (supabaseDataPayload.variants && supabaseDataPayload.variants.length === 0) supabaseDataPayload.variants = null;
  if (supabaseDataPayload.availablePrintDesigns && supabaseDataPayload.availablePrintDesigns.length === 0) supabaseDataPayload.availablePrintDesigns = null;
  if (supabaseDataPayload.reviews && supabaseDataPayload.reviews.length === 0) supabaseDataPayload.reviews = null;


  try {
    let savedProduct;
    let operationError = null;

    if (id && isValidUUID(id)) { // This is an UPDATE
      console.log(`[API /api/admin/products POST] Attempting to UPDATE product with ID: ${id}. Data to update:`, JSON.stringify(supabaseDataPayload, null, 2));
      const { data, error } = await clientForWrite
        .from('products')
        .update(supabaseDataPayload) // Supabase trigger will handle updatedAt
        .eq('id', id)
        .select()
        .single();
      savedProduct = data;
      operationError = error;
    } else { // This is an INSERT
      // For insert, Supabase will generate 'id', 'createdAt', 'updatedAt'.
      console.log(`[API /api/admin/products POST] Attempting to INSERT new product. Data to insert:`, JSON.stringify(supabaseDataPayload, null, 2));
      const { data, error } = await clientForWrite
        .from('products')
        .insert(supabaseDataPayload)
        .select()
        .single();
      savedProduct = data;
      operationError = error;
    }

    if (operationError) {
      console.error('[API /api/admin/products POST] Supabase error during save/update:', operationError);
      throw operationError;
    }

    if (!savedProduct) {
      console.error('[API /api/admin/products POST] Supabase operation succeeded but returned no data. This might indicate an issue with the select() after insert/update or RLS if not using service_role.');
      return NextResponse.json({ message: 'Product operation succeeded but no data returned from database.' }, { status: 500 });
    }

    console.log("[API /api/admin/products POST] Product saved successfully to Supabase:", savedProduct.name);
    return NextResponse.json(savedProduct);

  } catch (error: any) {
    console.error('[API /api/admin/products POST] Unhandled error saving product to Supabase:', error);
    return NextResponse.json({
      message: `Error saving product to database: ${error.message}`,
      rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
    }, { status: 500 });
  }
}

