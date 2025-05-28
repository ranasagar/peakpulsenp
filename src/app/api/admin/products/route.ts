
// /src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient.ts';
import type { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

async function getProductsFromSupabase() {
  const clientForRead = supabaseAdmin || fallbackSupabase;
  if (!clientForRead) {
    console.error('[API /api/admin/products GET] Supabase client for read is not initialized.');
    throw new Error('Database client not configured for product reads.');
  }
  console.log(`[API /api/admin/products GET] Fetching products using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);
  const { data, error } = await clientForRead
    .from('products')
    .select('*')
    .order('"createdAt"', { ascending: false }); // Ensure quoted if camelCase

  if (error) {
    console.error('[API /api/admin/products GET] Supabase error fetching products:', error);
    throw error;
  }
  return data?.map(p => ({...p, createdAt: p.createdAt || p.created_at, updatedAt: p.updatedAt || p.updated_at })) || [];
}

export async function GET() {
  console.log("[API /api/admin/products] GET request received for admin.");
  try {
    if (!fallbackSupabase && !supabaseAdmin) {
      console.error('[API /api/admin/products GET] Both Supabase clients are null. Check environment variables and server restart.');
      return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
    }
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
  const clientForWrite = supabaseAdmin || fallbackSupabase;

  if (!clientForWrite) {
    const errorMsg = supabaseAdmin ? '[API /api/admin/products POST] Admin Supabase client (service_role) is not initialized.' : '[API /api/admin/products POST] Public Supabase client (fallback) is not initialized.';
    console.error(errorMsg + ' Check environment variables, especially SUPABASE_SERVICE_ROLE_KEY, and server restart.');
    return NextResponse.json({
        message: 'Database client (for write) not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client for write operations not initialized.' }
    }, { status: 503 });
  }
  if (!supabaseAdmin) {
      console.warn("[API /api/admin/products POST] WARNING: Using public anon key for product save/update because SUPABASE_SERVICE_ROLE_KEY is likely not set. RLS policies for 'anon' role on 'products' table will apply if RLS is enabled.");
  } else {
      console.log(`[API /api/admin/products POST] Using ADMIN client (service_role) for write operation.`);
  }


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

  const supabaseDataPayload: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'reviews'> & { slug: string } = {
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
    // reviews field removed from here
  };

  // Explicitly set optional fields to null if they are empty strings or undefined, to avoid database errors
  // This loop might be too aggressive, ensure it doesn't nullify intended empty arrays for jsonb
  for (const key in supabaseDataPayload) {
    if (supabaseDataPayload[key as keyof typeof supabaseDataPayload] === undefined) {
      (supabaseDataPayload as any)[key] = null;
    }
  }
  // Ensure array fields are empty arrays if null/undefined, not null itself if DB expects array
  if (supabaseDataPayload.variants === null) supabaseDataPayload.variants = [];
  if (supabaseDataPayload.images === null) supabaseDataPayload.images = []; // Should have default in DB
  if (supabaseDataPayload.categories === null) supabaseDataPayload.categories = []; // Should have default in DB
  if (supabaseDataPayload.availablePrintDesigns === null) supabaseDataPayload.availablePrintDesigns = [];
  if (supabaseDataPayload.tags === null) supabaseDataPayload.tags = [];


  try {
    let savedProduct;
    let operationError = null;
    let operationType = '';

    // Explicitly set updatedAt for updates, rely on DB default for inserts
    const updateTimestamp = new Date().toISOString();

    if (id && isValidUUID(id)) {
      operationType = 'UPDATE';
      const updatePayload = { ...supabaseDataPayload, updatedAt: updateTimestamp };
      console.log(`[API /api/admin/products POST] Attempting to UPDATE product with ID: ${id}. Data:`, JSON.stringify(updatePayload, null, 2));
      const { data, error } = await clientForWrite
        .from('products')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      savedProduct = data;
      operationError = error;
    } else {
      operationType = 'INSERT';
      // For insert, Supabase will generate 'id', 'createdAt', 'updatedAt'.
      // Do not send client-generated 'id' if it's not a valid UUID
      const insertPayload = { ...supabaseDataPayload, createdAt: updateTimestamp, updatedAt: updateTimestamp };
      console.log(`[API /api/admin/products POST] Attempting to INSERT new product. Data:`, JSON.stringify(insertPayload, null, 2));
      const { data, error } = await clientForWrite
        .from('products')
        .insert(insertPayload)
        .select()
        .single();
      savedProduct = data;
      operationError = error;
    }

    if (operationError) {
      console.error(`[API /api/admin/products POST] Supabase error during ${operationType}:`, operationError);
      // Try to extract more specific error message
      const message = operationError.message || `Failed to ${operationType.toLowerCase()} product.`;
      const details = operationError.details || null;
      const hint = operationError.hint || null;
      const code = operationError.code || null;
      return NextResponse.json({
        message: `Database error: ${message}`,
        rawSupabaseError: { message, details, hint, code }
      }, { status: code === 'PGRST116' ? 404 : 500 });
    }

    if (!savedProduct) {
      console.error(`[API /api/admin/products POST] Supabase ${operationType} operation succeeded but returned no data.`);
      return NextResponse.json({ message: `Product ${operationType.toLowerCase()} operation succeeded but no data returned from database.` }, { status: 500 });
    }
    
    const responseProduct = {...savedProduct, createdAt: savedProduct.createdAt || savedProduct.created_at, updatedAt: savedProduct.updatedAt || savedProduct.updated_at};
    console.log(`[API /api/admin/products POST] Product ${operationType.toLowerCase()}d successfully:`, responseProduct.name);
    return NextResponse.json(responseProduct);

  } catch (error: any) {
    console.error('[API /api/admin/products POST] Unhandled error saving product to Supabase:', error);
    return NextResponse.json({
      message: `Error saving product to database: ${error.message}`,
      rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
    }, { status: 500 });
  }
}
