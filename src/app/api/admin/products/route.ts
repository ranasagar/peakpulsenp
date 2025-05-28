
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
  // console.log(`[API /api/admin/products GET] Fetching products using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);
  const { data, error } = await clientForRead
    .from('products')
    .select('*')
    .order('"createdAt"', { ascending: false });

  if (error) {
    console.error('[API /api/admin/products GET] Supabase error fetching products:', error);
    throw error;
  }
  return data?.map(p => ({...p, createdAt: p.createdAt || p.created_at, updatedAt: p.updatedAt || p.updated_at })) || [];
}

export async function GET() {
  // console.log("[API /api/admin/products] GET request received for admin.");
  try {
    if (!fallbackSupabase && !supabaseAdmin) {
      console.error('[API /api/admin/products GET] Both Supabase clients are null. Check environment variables and server restart.');
      return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
    }
    const products = await getProductsFromSupabase();
    // console.log(`[API /api/admin/products] Fetched ${products.length} products for admin.`);
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
  console.log("[API /api/admin/products POST] Request received to save product.");
  const clientForWrite = supabaseAdmin || fallbackSupabase;

  if (!clientForWrite) {
    const errorMsg = supabaseAdmin ? '[API /api/admin/products POST] Admin Supabase client (service_role) is not initialized.' : '[API /api/admin/products POST] Public Supabase client (fallback) is not initialized.';
    console.error(errorMsg + ' Check environment variables, especially SUPABASE_SERVICE_ROLE_KEY, and server restart.');
    return NextResponse.json({
        message: 'Database client (for write) not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client for write operations not initialized.' }
    }, { status: 503 });
  }
  if (clientForWrite === fallbackSupabase) {
      console.warn("[API /api/admin/products POST] WARNING: Using public anon key for product save/update because SUPABASE_SERVICE_ROLE_KEY is likely not set. RLS policies for 'anon' role on 'products' table will apply if RLS is enabled.");
  } else {
      console.log(`[API /api/admin/products POST] Using ADMIN client (service_role) for write operation.`);
  }

  let productDataFromRequest: Partial<Product>;
  try {
    productDataFromRequest = (await request.json()) as Partial<Product>;
    console.log("[API /api/admin/products POST] Received product data for save/update:", JSON.stringify(productDataFromRequest).substring(0, 500) + "...");
  } catch (e: any) {
    console.error('[API /api/admin/products POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', errorDetails: e.message }, { status: 400 });
  }

  const { id, name, slug, ...restOfProductData } = productDataFromRequest;

  if (!name) {
    return NextResponse.json({ message: 'Product name is required.' }, { status: 400 });
  }
  
  const finalSlug = slug?.trim() ? slug.trim() : name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  const supabaseDataPayload = {
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
    isFeatured: productDataFromRequest.isFeatured === undefined ? false : productDataFromRequest.isFeatured, // Default to false
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
    // 'reviews' field should not be directly saved to the products table
  };

  // Explicitly set optional fields to null if they are empty strings or undefined for Supabase
  (Object.keys(supabaseDataPayload) as Array<keyof typeof supabaseDataPayload>).forEach(key => {
    if (supabaseDataPayload[key] === undefined) {
      (supabaseDataPayload as any)[key] = null;
    }
  });
   if (supabaseDataPayload.variants === null) supabaseDataPayload.variants = [];
   if (supabaseDataPayload.images === null) supabaseDataPayload.images = []; 
   if (supabaseDataPayload.categories === null) supabaseDataPayload.categories = []; 
   if (supabaseDataPayload.availablePrintDesigns === null) supabaseDataPayload.availablePrintDesigns = [];
   if (supabaseDataPayload.tags === null) supabaseDataPayload.tags = [];

  try {
    let savedProduct;
    let operationError = null;
    let operationType = '';

    // The database trigger will handle createdAt and updatedAt.
    // No need to set them explicitly here anymore.

    if (id && isValidUUID(id)) {
      operationType = 'UPDATE';
      const updatePayload = { ...supabaseDataPayload }; // updatedAt will be handled by trigger
      console.log(`[API /api/admin/products POST] Attempting to UPDATE product with ID: ${id}. Data:`, JSON.stringify(updatePayload).substring(0, 500) + "...");
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
      const insertPayload = { ...supabaseDataPayload }; // createdAt and updatedAt by trigger/default
      console.log(`[API /api/admin/products POST] Attempting to INSERT new product. Data:`, JSON.stringify(insertPayload).substring(0, 500) + "...");
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
      const message = operationError.message || `Failed to ${operationType.toLowerCase()} product.`;
      return NextResponse.json({
        message: `Database error: ${message}`,
        rawSupabaseError: { message: operationError.message, details: operationError.details, hint: operationError.hint, code: operationError.code }
      }, { status: operationError.code === 'PGRST116' ? 404 : 500 }); // PGRST116 for "0 rows"
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

    