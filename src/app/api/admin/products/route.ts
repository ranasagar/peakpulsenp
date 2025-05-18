
// /src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types';

const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');

// Helper function to read products
async function getProducts(): Promise<Product[]> {
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error('Error reading products file for admin:', error);
    throw error; // Re-throw to be caught by the handler
  }
}

// Helper function to write products
async function saveProducts(products: Product[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(products, null, 2), 'utf-8');
}

export async function GET() {
  // IMPORTANT: Add authentication/authorization for admin access here in a real app
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching products for admin', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // IMPORTANT: Add authentication/authorization for admin access here
  // This file writing approach is NOT suitable for production serverless environments
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn("File system write attempts for products are disabled in Vercel production environment for this demo API.");
    return NextResponse.json({ message: 'Product modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const productData = (await request.json()) as Product | { products: Product[] }; // Can receive a single product or a full list
    let products = await getProducts();

    if ('products' in productData) { // If a whole list is sent (e.g. for reordering or bulk delete)
        products = productData.products;
    } else { // Single product add or update
        const productPayload = productData as Product; // Cast to Product
        const existingProductIndex = products.findIndex(p => p.id === productPayload.id);

        if (existingProductIndex > -1) {
          // Update existing product
          products[existingProductIndex] = {
             ...products[existingProductIndex], // Keep existing fields not explicitly sent
             ...productPayload, // Overwrite with new data
             updatedAt: new Date().toISOString()
          };
        } else {
          // Add new product
          const newProduct: Product = {
            ...productPayload,
            id: productPayload.id || `prod-${Date.now()}`,
            slug: productPayload.slug || productPayload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            images: productPayload.images || [],
            categories: productPayload.categories || [],
            // Ensure variants, costPrice, and stock are included
            variants: productPayload.variants || undefined,
            costPrice: productPayload.costPrice,
            stock: productPayload.stock,
            // Default other optional fields if not provided
            compareAtPrice: productPayload.compareAtPrice,
            shortDescription: productPayload.shortDescription,
            fabricDetails: productPayload.fabricDetails,
            careInstructions: productPayload.careInstructions,
            sustainabilityMetrics: productPayload.sustainabilityMetrics,
            fitGuide: productPayload.fitGuide,
            sku: productPayload.sku,
            averageRating: productPayload.averageRating || 0,
            reviewCount: productPayload.reviewCount || 0,
            isFeatured: productPayload.isFeatured || false,
          };
          products.push(newProduct);
        }
    }

    await saveProducts(products);
    return NextResponse.json({ message: 'Products updated successfully.', products });

  } catch (error) {
    console.error('Error updating products.json:', error);
    return NextResponse.json({ message: 'Error updating products', error: (error as Error).message }, { status: 500 });
  }
}
