
// /src/app/api/admin/orders/[orderId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts'; // Changed to relative path
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { ALL_ORDER_STATUSES, ALL_PAYMENT_STATUSES } from '@/types';


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

  if (!orderId) {
    console.warn(`[API /api/admin/orders/${orderId}] Order ID is required, but not provided.`);
    return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
  }

  // In a real app, this endpoint MUST be secured for admin access only.
  // For demo, we skip auth, but in production, verify admin role here.

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

    const updatesToMake: Partial<Order> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(), // Supabase trigger might handle this, but explicit is fine
    };
    if (status) updatesToMake.status = status;
    if (paymentStatus) updatesToMake.paymentStatus = paymentStatus;
    
    console.log(`[API /api/admin/orders/${orderId}] Data being sent to Supabase for update:`, updatesToMake);

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updatesToMake)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error(`[API /api/admin/orders/${orderId}] Supabase error updating order:`, error);
      if (error.code === 'PGRST116') { // No rows found for update
        return NextResponse.json({ message: `Order with ID ${orderId} not found.` }, { status: 404 });
      }
      return NextResponse.json({ message: 'Error updating order in Supabase.', error: error.message, details: error.details }, { status: 500 });
    }
    
    if (!updatedOrder) {
        console.error(`[API /api/admin/orders/${orderId}] Order was not updated/returned after Supabase operation, but no explicit error.`);
        return NextResponse.json({ message: 'Order update completed but no data returned from Supabase.' }, { status: 500 });
    }

    let updateMessage = `Order ${orderId} updated successfully.`;
    console.log(`[API /api/admin/orders/${orderId}] ${updateMessage} New data:`, updatedOrder);
    return NextResponse.json({ message: updateMessage, order: updatedOrder });

  } catch (error) {
    console.error(`[API /api/admin/orders/${orderId}] Unhandled error updating order:`, error);
    return NextResponse.json({ message: 'Error updating order.', error: (error as Error).message }, { status: 500 });
  }
}
