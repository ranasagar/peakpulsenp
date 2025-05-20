
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
      return []; // File doesn't exist, meaning order cannot be found
    }
    throw error;
  }
}

async function saveOrders(orders: Order[]) {
  const jsonData = JSON.stringify(orders, null, 2);
  await fs.writeFile(ordersFilePath, jsonData, 'utf-8');
}

interface UpdateOrderPayload {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;
  console.log(`[API /api/admin/orders/${orderId}] PUT request received.`);
  
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn(`[API /api/admin/orders/${orderId}] Order update (JSON file write) is disabled in Vercel production environment for this demo.`);
    return NextResponse.json({ message: 'Order update is disabled in this environment.' }, { status: 403 });
  }

  if (!orderId) {
    console.warn(`[API /api/admin/orders/${orderId}] Order ID is required for update.`);
    return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
  }

  try {
    const payload = (await request.json()) as UpdateOrderPayload;
    const { status, paymentStatus } = payload;
    console.log(`[API /api/admin/orders/${orderId}] Payload for update:`, payload);

    if (!status && !paymentStatus) {
      console.warn(`[API /api/admin/orders/${orderId}] Either order status or payment status must be provided for update.`);
      return NextResponse.json({ message: 'Either order status or payment status must be provided.' }, { status: 400 });
    }
    if (status && !ALL_ORDER_STATUSES.includes(status)) {
      console.warn(`[API /api/admin/orders/${orderId}] Invalid order status provided: ${status}`);
      return NextResponse.json({ message: 'Invalid order status provided.' }, { status: 400 });
    }
    if (paymentStatus && !ALL_PAYMENT_STATUSES.includes(paymentStatus)) {
      console.warn(`[API /api/admin/orders/${orderId}] Invalid payment status provided: ${paymentStatus}`);
      return NextResponse.json({ message: 'Invalid payment status provided.' }, { status: 400 });
    }

    let orders = await getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      console.warn(`[API /api/admin/orders/${orderId}] Order with ID ${orderId} not found in orders.json.`);
      return NextResponse.json({ message: `Order with ID ${orderId} not found.` }, { status: 404 });
    }

    const orderToUpdate = { ...orders[orderIndex] };
    let updated = false;

    if (status && orderToUpdate.status !== status) {
      orderToUpdate.status = status;
      updated = true;
    }
    if (paymentStatus && orderToUpdate.paymentStatus !== paymentStatus) {
      orderToUpdate.paymentStatus = paymentStatus;
      updated = true;
    }

    if (updated) {
      orderToUpdate.updatedAt = new Date().toISOString();
      orders[orderIndex] = orderToUpdate;
      await saveOrders(orders);
      console.log(`[API /api/admin/orders/${orderId}] Order ${orderId} updated successfully in orders.json.`);
      return NextResponse.json({ message: `Order ${orderId} updated successfully.`, order: orderToUpdate });
    } else {
      console.log(`[API /api/admin/orders/${orderId}] No changes to apply for order ${orderId}.`);
      return NextResponse.json({ message: 'No changes to apply.', order: orderToUpdate });
    }

  } catch (error) {
    console.error(`[API /api/admin/orders/${orderId}] Error updating order:`, error);
    return NextResponse.json({ message: 'Error updating order.', error: (error as Error).message }, { status: 500 });
  }
}
