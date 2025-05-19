
// /src/app/api/admin/orders/[orderId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { ALL_ORDER_STATUSES, ALL_PAYMENT_STATUSES } from '@/types';

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
  paymentStatus?: PaymentStatus;
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
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn("File system write attempts for orders are disabled in Vercel production environment for this demo API.");
    return NextResponse.json({ message: 'Order modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as UpdateOrderPayload;
    const { status, paymentStatus } = payload;

    if (!status && !paymentStatus) {
        return NextResponse.json({ message: 'Either order status or payment status must be provided.' }, { status: 400 });
    }
    if (status && !ALL_ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Invalid order status provided.' }, { status: 400 });
    }
    if (paymentStatus && !ALL_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json({ message: 'Invalid payment status provided.' }, { status: 400 });
    }


    const allOrders = await getOrders();
    const orderIndex = allOrders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return NextResponse.json({ message: `Order with ID ${orderId} not found.` }, { status: 404 });
    }

    let updateMessage = `Order ${orderId}`;
    const updatesMade: string[] = [];

    if (status) {
        allOrders[orderIndex].status = status;
        updatesMade.push(`order status to ${status}`);
    }
    if (paymentStatus) {
        allOrders[orderIndex].paymentStatus = paymentStatus;
        updatesMade.push(`payment status to ${paymentStatus}`);
    }
    
    allOrders[orderIndex].updatedAt = new Date().toISOString();
    updateMessage += ` updated: ${updatesMade.join(' and ')}.`;
    
    await saveOrders(allOrders);

    return NextResponse.json({ message: updateMessage, order: allOrders[orderIndex] });

  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
    return NextResponse.json({ message: 'Error updating order.', error: (error as Error).message }, { status: 500 });
  }
}
