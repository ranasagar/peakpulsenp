
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
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`[API /api/products] Successfully read and sorted ${products.length} products from JSON.`);
    return NextResponse.json(products);
  } catch (error) {
    console.error('[API /api/products] Error reading or parsing products.json:', error);
    return NextResponse.json(
      { message: 'Error fetching products', error: (error as Error).message },
      { status: 500 }
    );
  }
}
