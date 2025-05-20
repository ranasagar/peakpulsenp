
// /src/app/api/orders/create/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts';
import type { CartItem, OrderAddress, OrderStatus, PaymentStatus } from '@/types';

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
  cartItems: CartItem[]; // CartItem should now include costPrice
  shippingDetails: ShippingDetails;
  orderSubtotal: number;
  shippingCost: number;
  orderTotal: number;
}

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

export async function POST(request: NextRequest) {
  console.log("[API /api/orders/create] POST request received.");
  if (!supabase) {
    console.error('[API /api/orders/create] Supabase client is not initialized.');
    return NextResponse.json({ title: "Server Error", message: 'Database client not configured.' }, { status: 503 });
  }

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
      responseMessage += ' Payment: Cash on Delivery. Our team may contact you for confirmation regarding the 10% advance.';
      console.log(`[API /api/orders/create] COD order for ${userId}. 10% advance might be initiated.`);
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
      const expiryMatch = expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/);
      if (!expiryMatch) {
        console.warn("[API /api/orders/create] Invalid expiry date format.");
        return NextResponse.json({ title: "Payment Failed", message: 'Invalid expiry date format. Use MM/YY.' }, { status: 400 });
      }
      if (!/^\d{3,4}$/.test(cvc.trim())) {
        console.warn("[API /api/orders/create] Invalid CVC format.");
        return NextResponse.json({ title: "Payment Failed", message: 'CVC must be 3 or 4 digits.' }, { status: 400 });
      }
      
      console.log(`[API /api/orders/create] Processing international card payment for ${userId} (mock). Card ending ${cardNumber.slice(-4)}.`);
      responseMessage += ` Payment: International Card (ending ${cardNumber.slice(-4)}). Shipping fee: रू${shippingCost.toLocaleString()}.`;
      responseTitle = "International Order Placed";
      paymentStatus = 'Paid'; // Simulate successful payment for demo
      orderStatus = 'Processing';
    } else if (['card_nepal', 'esewa', 'khalti', 'imepay', 'connectips', 'qr', 'banktransfer'].includes(paymentMethod)) {
      console.log(`[API /api/orders/create] Order for ${userId} via ${paymentMethod}. User will be prompted/redirected.`);
      responseMessage += ` Payment: ${paymentMethod}. You will be prompted to complete your payment.`;
      responseTitle = "Order Pending Payment";
      paymentStatus = 'Pending';
      orderStatus = 'Pending';
    } else {
       console.warn(`[API /api/orders/create] Invalid payment method selected: ${paymentMethod}`);
       return NextResponse.json({ title: "Payment Failed", message: 'Invalid payment method selected.' }, { status: 400 });
    }

    // Ensure all cart items have essential properties before saving
    const sanitizedCartItems = cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      price: item.price,
      costPrice: item.costPrice, // Ensure costPrice is included
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      dataAiHint: item.dataAiHint,
      customization: item.customization,
    }));

    const orderToInsert = {
      userId: userId,
      items: sanitizedCartItems, // Use sanitized items
      totalAmount: orderTotal,
      currency: 'NPR',
      status: orderStatus,
      shippingAddress: {
        street: streetAddress,
        city: city,
        postalCode: postalCode,
        country: country,
        fullName: fullName,
        phone: phone || undefined,
        state: shippingDetails.isInternational ? undefined : country, // Assuming 'country' doubles as state for Nepal
        apartmentSuite: apartmentSuite || undefined,
      } as OrderAddress,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      // createdAt and updatedAt will be set by Supabase defaults
    };
    
    console.log(`[API /api/orders/create] New order object to be inserted into Supabase:`, JSON.stringify(orderToInsert, null, 2));

    const { data: newOrderData, error: insertError } = await supabase
      .from('orders')
      .insert(orderToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[API /api/orders/create] Supabase error inserting order:', insertError);
      return NextResponse.json({ title: "Order Creation Failed", message: 'Could not save your order to the database.', rawError: insertError.message, rawSupabaseError: insertError }, { status: 500 });
    }
    
    console.log(`[API /api/orders/create] Order ${newOrderData.id} saved successfully to Supabase for user ${userId}.`);
    return NextResponse.json({ title: responseTitle, message: responseMessage, orderId: newOrderData.id }, { status: 201 });

  } catch (error) {
    console.error('[API /api/orders/create] Unhandled error processing order API:', error);
    let errorMessage = 'Failed to process order.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ title: "Order Error", message: 'Error processing order.', error: errorMessage }, { status: 500 });
  }
}
