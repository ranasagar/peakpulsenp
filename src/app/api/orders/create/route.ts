
// /src/app/api/orders/create/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CartItem, OrderAddress, OrderStatus, PaymentStatus } from '@/types';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path

function luhnCheck(val: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  const numStr = val.replace(/\D/g, ""); 

  if (numStr.length < 13 || numStr.length > 19) return false;

  for (let i = numStr.length - 1; i >= 0; i--) {
    let digit = parseInt(numStr.charAt(i));
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
}

interface ShippingDetails {
  fullName: string;
  streetAddress: string;
  apartmentSuite?: string;
  city: string;
  country: string;
  postalCode: string;
  phone?: string;
  isInternational?: boolean;
  internationalDestinationCountry?: string;
  promoCode?: string;
  saveInfo?: boolean;
  paymentMethod: string;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
}

interface CreateOrderPayload {
  userId?: string; 
  cartItems: CartItem[];
  shippingDetails: ShippingDetails;
  orderSubtotal: number;
  shippingCost: number;
  orderTotal: number;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/orders/create] POST request received.");
  try {
    const payload = (await request.json()) as CreateOrderPayload;
    console.log('[API /api/orders/create] Received order payload:', JSON.stringify(payload, null, 2));

    const { userId, cartItems, shippingDetails, orderSubtotal, shippingCost, orderTotal } = payload;
    const { paymentMethod, country, cardNumber, expiryDate, cvc, cardholderName, streetAddress, city, postalCode, fullName, phone, apartmentSuite } = shippingDetails;

    if (!userId) {
      console.warn("[API /api/orders/create] User ID is missing. This is required for saving orders.");
      return NextResponse.json({ title: "Order Error", message: 'User ID is missing. Unable to process order.' }, { status: 400 });
    }
    if (!cartItems || cartItems.length === 0) {
      console.warn("[API /api/orders/create] Cart is empty. Order cannot be processed.");
      return NextResponse.json({ title: "Order Error", message: 'Cart is empty.' }, { status: 400 });
    }

    let responseMessage = `Order for ${shippingDetails.fullName} (Total: रू${orderTotal.toLocaleString()}) received.`;
    let responseTitle = "Order Received";
    let paymentStatus: PaymentStatus = 'Pending';
    let orderStatus: OrderStatus = 'Pending';

    if (paymentMethod === 'cod') {
      responseMessage += ' Payment: Cash on Delivery. Our team may contact you for confirmation.';
      responseTitle = "COD Order Placed";
      paymentStatus = 'Pending';
      orderStatus = 'Processing';
    } else if (paymentMethod === 'card_international') {
      if (!cardNumber || !expiryDate || !cvc || !cardholderName) {
        console.warn("[API /api/orders/create] Missing international card details for card_international payment.");
        return NextResponse.json({ title: "Payment Failed", message: 'Missing international card details.' }, { status: 400 });
      }
      if (!luhnCheck(cardNumber)) {
        console.warn("[API /api/orders/create] Invalid credit card number (Luhn check failed).");
        return NextResponse.json({ title: "Payment Failed", message: 'Invalid credit card number (Luhn check failed).' }, { status: 400 });
      }
      // Further card validation logic can be added here
      responseMessage += ` Payment: International Card (ending ${cardNumber.slice(-4)}). Shipping fee: रू${shippingCost.toLocaleString()}.`;
      responseTitle = "International Order Placed";
      paymentStatus = 'Paid'; // Simulate successful payment for demo
      orderStatus = 'Processing';
    } else if (['card_nepal', 'esewa', 'khalti', 'imepay', 'connectips', 'qr', 'banktransfer'].includes(paymentMethod)) {
      responseMessage += ` Payment: ${paymentMethod}. You will be prompted to complete your payment via the ${paymentMethod} interface.`;
      responseTitle = "Order Pending Payment";
      paymentStatus = 'Pending';
      orderStatus = 'Pending';
    } else {
       console.warn(`[API /api/orders/create] Invalid payment method selected: ${paymentMethod}`);
       return NextResponse.json({ title: "Payment Failed", message: 'Invalid payment method selected.' }, { status: 400 });
    }

    const orderToInsert = {
      userId: userId,
      items: cartItems as any, 
      totalAmount: orderTotal,
      currency: 'NPR',
      status: orderStatus,
      shippingAddress: { 
        street: streetAddress,
        city: city,
        postalCode: postalCode,
        country: country,
        fullName: fullName,
        phone: phone || null,
        apartmentSuite: apartmentSuite || null,
      } as any, 
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      // createdAt and updatedAt will be set by Supabase default or trigger
    };
    
    console.log("[API /api/orders/create] Order object being sent to Supabase:", JSON.stringify(orderToInsert, null, 2));

    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert([orderToInsert]) 
      .select()
      .single(); 

    if (insertError) {
      console.error('[API /api/orders/create] Supabase order insert error:', insertError);
      return NextResponse.json({ title: "Database Error", message: 'Could not save order to database.', error: insertError.message, details: insertError.details }, { status: 500 });
    }
    
    if (!newOrder) {
        console.error('[API /api/orders/create] Order was not saved/returned after Supabase insert, but no explicit error.');
        return NextResponse.json({ title: "Database Error", message: 'Order created but no data returned from database.' }, { status: 500 });
    }
    
    console.log('[API /api/orders/create] Order successfully inserted into Supabase:', newOrder);
    return NextResponse.json({ title: responseTitle, message: responseMessage, orderId: newOrder.id }, { status: 201 });

  } catch (error) {
    console.error('[API /api/orders/create] Unhandled error processing order API:', error);
    let errorMessage = 'Failed to process order.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ title: "Order Error", message: 'Error processing order.', error: errorMessage }, { status: 500 });
  }
}
