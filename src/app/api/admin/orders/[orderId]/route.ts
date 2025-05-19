
// /src/app/api/admin/orders/[orderId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Order, OrderStatus } from '@/types';
import { ALL_ORDER_STATUSES } from '@/types';

const ordersFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

async function getOrders(): Promise<Order[]> {
  try {
    const jsonData = await fs.readFile(ordersFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; 
    }
    console.error('Error reading orders.json:', error);
    throw error; 
  }
}

async function saveOrders(orders: Order[]): Promise<void> {
  await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
}

interface UpdateOrderPayload {
  status?: OrderStatus;
  // Add other fields you might want to update, e.g., trackingNumber
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;
  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
  }

  // IMPORTANT: Add authentication/authorization for admin access here
  // This file writing approach is NOT suitable for production serverless environments
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn("File system write attempts for orders are disabled in Vercel production environment for this demo API.");
    return NextResponse.json({ message: 'Order modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as UpdateOrderPayload;
    const { status } = payload;

    if (!status || !ALL_ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Invalid or missing order status provided.' }, { status: 400 });
    }

    const allOrders = await getOrders();
    const orderIndex = allOrders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return NextResponse.json({ message: `Order with ID ${orderId} not found.` }, { status: 404 });
    }

    allOrders[orderIndex].status = status;
    allOrders[orderIndex].updatedAt = new Date().toISOString();
    // If status is 'Shipped', you might want to add logic to set trackingNumber here
    // if (status === 'Shipped' && payload.trackingNumber) {
    //   allOrders[orderIndex].trackingNumber = payload.trackingNumber;
    // }

    await saveOrders(allOrders);

    return NextResponse.json({ message: `Order ${orderId} status updated to ${status}.`, order: allOrders[orderIndex] });

  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
    return NextResponse.json({ message: 'Error updating order status.', error: (error as Error).message }, { status: 500 });
  }
}
