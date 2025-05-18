
// /src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types';

const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');

export async function GET() {
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const products: Product[] = JSON.parse(jsonData);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to read products.json:', error);
    // Return an empty array or an error message if the file is not found or malformed
    return NextResponse.json({ message: 'Error fetching products', error: (error as Error).message }, { status: 500 });
  }
}
