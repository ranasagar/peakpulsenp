
// /src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data

const productsFilePath = path.join(process.cwd(), 'src', 'data', 'products.json');

export async function GET() {
  console.log("[API /api/products] GET request received. Attempting to read products.json");
  try {
    const jsonData = await fs.readFile(productsFilePath, 'utf-8');
    let products: Product[] = JSON.parse(jsonData);

    // Sort products by createdAt date, newest first
    products.sort((a, b) => {
      // Ensure createdAt exists and is a valid date string for comparison
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    console.log(`[API /api/products] Successfully read and sorted ${products.length} products from JSON.`);
    return NextResponse.json(products);
  } catch (error) {
    console.error('[API /api/products] Error reading or parsing products.json:', error);
    // In case of error (e.g., file not found, invalid JSON), return an empty array or an error response
    return NextResponse.json(
      { message: 'Error fetching products', error: (error as Error).message, details: "Could not load products from products.json" },
      { status: 500 }
    );
  }
}
