
// /src/app/api/admin/orders/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Order } from '@/types';

const ordersFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

// Helper function to read orders
async function getOrders(): Promise<Order[]> {
  try {
    const jsonData = await fs.readFile(ordersFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // Return empty array if file doesn't exist
    }
    console.error('Error reading orders.json for admin:', error);
    throw error; // Re-throw other errors
  }
}

export async function GET() {
  // IMPORTANT: Add authentication/authorization for admin access here in a real app
  try {
    const orders = await getOrders();
    // Sort orders by creation date, newest first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching orders for admin', error: (error as Error).message }, { status: 500 });
  }
}
