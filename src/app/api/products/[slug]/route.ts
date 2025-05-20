
// /src/app/api/products/[slug]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

const productsFilePath = path.join(process.cwd(), 'src', 'data', 'products.json');

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  console.log(`[API /api/products/[slug]] GET request for slug: ${slug}`);

  if (!slug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const jsonData = await fs.readFile(productsFilePath, 'utf-8');
    const products: Product[] = JSON.parse(jsonData);
    const product = products.find(p => p.slug === slug);

    if (product) {
      console.log(`[API /api/products/[slug]] Product found for slug ${slug}:`, product.name);
      return NextResponse.json(product);
    } else {
      console.warn(`[API /api/products/[slug]] Product not found for slug ${slug} in products.json.`);
      return NextResponse.json({ message: `Product with slug '${slug}' not found.` }, { status: 404 });
    }
  } catch (error) {
    console.error(`[API /api/products/[slug]] Error reading or parsing products.json for slug ${slug}:`, error);
    return NextResponse.json({ message: 'Error fetching product.', error: (error as Error).message }, { status: 500 });
  }
}
