
// /src/app/api/account/orders/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Order } from '@/types';

const ordersFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

async function getOrders(): Promise<Order[]> {
  try {
    const jsonData = await fs.readFile(ordersFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File doesn't exist, return empty array
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  console.log(`[API /api/account/orders] GET request for userId: ${userId}`);

  if (!userId) {
    console.warn("[API /api/account/orders] User ID is required, but not provided.");
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const allOrders = await getOrders();
    const userOrders = allOrders.filter(order => order.userId === userId)
                                 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`[API /api/account/orders] Successfully fetched ${userOrders.length} orders for userId: ${userId} from JSON.`);
    return NextResponse.json(userOrders);
  } catch (error) {
    console.error('[API /api/account/orders] Error fetching user orders from JSON:', error);
    return NextResponse.json({ message: 'Error fetching user orders', error: (error as Error).message }, { status: 500 });
  }
}
