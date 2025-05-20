
// /src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs if necessary

const productsFilePath = path.join(process.cwd(), 'src', 'data', 'products.json');

async function getProducts(): Promise<Product[]> {
  try {
    const jsonData = await fs.readFile(productsFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
      return [];
    }
    throw error; // Re-throw other errors
  }
}

async function saveProducts(products: Product[]) {
  const jsonData = JSON.stringify(products, null, 2);
  await fs.writeFile(productsFilePath, jsonData, 'utf-8');
}

export async function GET() {
  console.log("[API /api/admin/products] GET request received.");
  try {
    const products = await getProducts();
    console.log(`[API /api/admin/products] Fetched ${products.length} products for admin.`);
    return NextResponse.json(products);
  } catch (error) {
    console.error('[API /api/admin/products] Error fetching products for admin:', error);
    return NextResponse.json({ message: 'Error fetching products for admin', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("[API /api/admin/products] POST request received to save product.");
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn("[API /api/admin/products] Product modification (JSON file write) is disabled in Vercel production environment for this demo.");
    return NextResponse.json({ message: 'Product modification is disabled in this environment.' }, { status: 403 });
  }

  try {
    const productData = (await request.json()) as Product;
    console.log("[API /api/admin/products] Received product data:", JSON.stringify(productData, null, 2));

    let products = await getProducts();
    const productIndex = products.findIndex(p => p.id === productData.id);

    const slug = productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const finalProductData = {
      ...productData,
      slug,
      updatedAt: new Date().toISOString(),
    };
    
    // Sanitize optional numeric fields, ensure arrays are properly formatted
    finalProductData.price = Number(finalProductData.price) || 0;
    finalProductData.compareAtPrice = finalProductData.compareAtPrice ? Number(finalProductData.compareAtPrice) : undefined;
    finalProductData.costPrice = finalProductData.costPrice ? Number(finalProductData.costPrice) : undefined;
    finalProductData.stock = (finalProductData.variants && finalProductData.variants.length > 0)
                           ? finalProductData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
                           : (Number(finalProductData.stock) || 0);
    finalProductData.images = Array.isArray(finalProductData.images) ? finalProductData.images.map(img => ({...img, id: img.id || uuidv4()})) : [];
    finalProductData.categories = Array.isArray(finalProductData.categories) ? finalProductData.categories.map(cat => ({...cat, id: cat.id || uuidv4()})) : [];
    finalProductData.variants = (Array.isArray(finalProductData.variants) ? finalProductData.variants : []).map(variant => ({
      ...variant,
      id: variant.id || uuidv4(),
      price: Number(variant.price) || 0,
      costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
      stock: Number(variant.stock) || 0,
    }));
    finalProductData.availablePrintDesigns = Array.isArray(finalProductData.availablePrintDesigns) ? finalProductData.availablePrintDesigns.map(d => ({...d, id: d.id || uuidv4()})) : [];


    if (productIndex > -1) {
      // Update existing product
      console.log(`[API /api/admin/products] Updating product with ID: ${finalProductData.id}`);
      products[productIndex] = { ...products[productIndex], ...finalProductData };
    } else {
      // Add new product
      const newProduct = {
        ...finalProductData,
        id: finalProductData.id || uuidv4(), // Ensure new products get a UUID if not client-generated correctly
        createdAt: new Date().toISOString(),
      };
      console.log(`[API /api/admin/products] Adding new product with ID: ${newProduct.id}`);
      products.push(newProduct);
    }

    await saveProducts(products);
    console.log("[API /api/admin/products] Products saved successfully to products.json.");
    // Return the saved/updated product
    const savedProduct = products.find(p => p.id === (productIndex > -1 ? finalProductData.id : products[products.length-1].id));
    return NextResponse.json(savedProduct);

  } catch (error) {
    console.error('[API /api/admin/products] Error saving product:', error);
    return NextResponse.json({ message: 'Error saving product.', error: (error as Error).message }, { status: 500 });
  }
}
