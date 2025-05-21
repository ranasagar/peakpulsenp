
// /src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Using relative path
import type { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

async function getProductsFromSupabase(): Promise<Product[]> {
  if (!supabase) {
    console.error('[API /api/admin/products GET] Supabase client not available for getProductsFromSupabase.');
    throw new Error('Database client not configured.'); // Or return empty array and handle upstream
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[API /api/admin/products GET] Supabase error fetching products:', error);
    throw error; // Let the handler catch and format it
  }
  return data || [];
}

export async function GET() {
  console.log("[API /api/admin/products] GET request received.");
  if (!supabase) {
    console.error('[API /api/admin/products GET] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }
  try {
    const products = await getProductsFromSupabase();
    console.log(`[API /api/admin/products] Fetched ${products.length} products for admin.`);
    return NextResponse.json(products);
  } catch (error) {
    console.error('[API /api/admin/products GET] Error in GET handler:', error);
    return NextResponse.json({ message: 'Error fetching products for admin.', error: (error as Error).message, rawSupabaseError: error }, { status: 500 });
  }
}

function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

export async function POST(request: NextRequest) {
  console.log("[API /api/admin/products] POST request received to save product.");
  if (!supabase) {
    console.error('[API /api/admin/products POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }

  let productData;
  try {
    productData = (await request.json()) as Partial<Product>; // Use Partial as ID might be missing for new
    console.log("[API /api/admin/products] Received product data:", JSON.stringify(productData, null, 2));
  } catch (e) {
    console.error('[API /api/admin/products POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body.', error: (e as Error).message }, { status: 400 });
  }

  const { id, name, slug, ...restOfProductData } = productData;

  if (!name) {
    return NextResponse.json({ message: 'Product name is required.' }, { status: 400 });
  }
  
  const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  const dataToSave: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { slug: string; updatedAt: string; createdAt?: string; id?: string } = {
    name,
    slug: generatedSlug,
    price: Number(productData.price) || 0,
    compareAtPrice: productData.compareAtPrice ? Number(productData.compareAtPrice) : null,
    costPrice: productData.costPrice ? Number(productData.costPrice) : null,
    shortDescription: productData.shortDescription || undefined,
    description: productData.description || '',
    images: Array.isArray(productData.images) ? productData.images.map(img => ({ ...img, id: img.id || uuidv4() })) : [],
    categories: Array.isArray(productData.categories) ? productData.categories.map(cat => ({ ...cat, id: cat.id || uuidv4() })) : [],
    variants: (Array.isArray(productData.variants) ? productData.variants : []).map(variant => ({
      ...variant,
      id: variant.id || uuidv4(),
      price: Number(variant.price) || 0,
      costPrice: variant.costPrice ? Number(variant.costPrice) : null,
      stock: Number(variant.stock) || 0,
    })),
    stock: (productData.variants && productData.variants.length > 0)
           ? productData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
           : (Number(productData.stock) || 0),
    availablePrintDesigns: Array.isArray(productData.availablePrintDesigns) ? productData.availablePrintDesigns.map(d => ({...d, id: d.id || uuidv4()})) : [],
    customizationConfig: productData.customizationConfig || undefined,
    collections: productData.collections || undefined,
    tags: productData.tags || undefined,
    fabricDetails: productData.fabricDetails || undefined,
    careInstructions: productData.careInstructions || undefined,
    sustainabilityMetrics: productData.sustainabilityMetrics || undefined,
    fitGuide: productData.fitGuide || undefined,
    sku: productData.sku || undefined,
    averageRating: Number(productData.averageRating) || 0,
    reviewCount: Number(productData.reviewCount) || 0,
    isFeatured: productData.isFeatured || false,
    updatedAt: new Date().toISOString(),
  };


  try {
    let savedProduct;
    if (id && isValidUUID(id)) { // Check if ID is a valid UUID for update
      console.log(`[API /api/admin/products] Attempting to UPDATE product with ID: ${id}. Data:`, dataToSave);
      // @ts-ignore
      delete dataToSave.createdAt; // Don't update createdAt
      const { data, error } = await supabase
        .from('products')
        .update(dataToSave)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      savedProduct = data;
    } else {
      console.log(`[API /api/admin/products] Attempting to INSERT new product. Data:`, dataToSave);
      // If it's a new product, or ID is not a UUID (e.g. client-generated "prod-xxx"), let Supabase generate ID.
      // @ts-ignore
      dataToSave.createdAt = new Date().toISOString();
      const { id: clientGenId, ...insertData } = dataToSave; // remove client-gen id if present
      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      savedProduct = data;
    }

    console.log("[API /api/admin/products] Product saved successfully to Supabase:", savedProduct);
    return NextResponse.json(savedProduct);

  } catch (error) {
    console.error('[API /api/admin/products POST] Error saving product to Supabase:', error);
    return NextResponse.json({ message: 'Error saving product to database.', error: (error as Error).message, rawSupabaseError: error }, { status: 500 });
  }
}
