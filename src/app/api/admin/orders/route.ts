
// /src/app/api/admin/orders/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Order } from '@/types';

const ordersFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

async function getOrders(): Promise<Order[]> {
  try {
    const jsonData = await fs.readFile(ordersFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
      return [];
    }
    throw error; // Re-throw other errors
  }
}

export async function GET() {
  console.log("[API /api/admin/orders] GET request received. Attempting to read orders.json");
  try {
    const orders = await getOrders();
    // Sort orders by createdAt date, newest first
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`[API /api/admin/orders] Successfully fetched and sorted ${sortedOrders.length} orders from JSON.`);
    return NextResponse.json(sortedOrders);
  } catch (error) {
    console.error('[API /api/admin/orders] Error fetching orders for admin from JSON:', error);
    return NextResponse.json(
      { message: 'Error fetching orders for admin', error: (error as Error).message },
      { status: 500 }
    );
  }
}
