
// /src/app/api/orders/create/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem, OrderAddress, OrderStatus, PaymentStatus, Order } from '@/types';

const ordersFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

async function getOrders(): Promise<Order[]> {
  try {
    const jsonData = await fs.readFile(ordersFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File doesn't exist, start with empty array
    }
    throw error;
  }
}

async function saveOrders(orders: Order[]) {
  const jsonData = JSON.stringify(orders, null, 2);
  await fs.writeFile(ordersFilePath, jsonData, 'utf-8');
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
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn("[API /api/orders/create] Order creation (JSON file write) is disabled in Vercel production environment for this demo.");
    return NextResponse.json({ title: "Feature Disabled", message: 'Order creation is disabled in this environment for demo purposes.' }, { status: 403 });
  }
  try {
    const payload = (await request.json()) as CreateOrderPayload;
    console.log('[API /api/orders/create] Received order payload:', JSON.stringify(payload, null, 2));

    const { userId, cartItems, shippingDetails, orderSubtotal, shippingCost, orderTotal } = payload;
    const { paymentMethod, country, cardNumber, expiryDate, cvc, cardholderName, streetAddress, city, postalCode, fullName, phone, apartmentSuite } = shippingDetails;

    if (!userId) { // userId is now expected from client (Firebase Auth UID)
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
      paymentStatus = 'Pending'; // COD is pending until paid
      orderStatus = 'Processing'; // Order is processing once placed
    } else if (paymentMethod === 'card_international') {
      if (!cardNumber || !expiryDate || !cvc || !cardholderName) {
        console.warn("[API /api/orders/create] Missing international card details for card_international payment.");
        return NextResponse.json({ title: "Payment Failed", message: 'Missing international card details.' }, { status: 400 });
      }
      if (!luhnCheck(cardNumber)) {
        console.warn("[API /api/orders/create] Invalid credit card number (Luhn check failed).");
        return NextResponse.json({ title: "Payment Failed", message: 'Invalid credit card number (Luhn check failed).' }, { status: 400 });
      }
      // Basic expiry date and CVC validation (can be enhanced)
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
      console.log(`[API /api/orders/create] Order for ${userId} via ${paymentMethod}. User will be redirected/prompted.`);
      responseMessage += ` Payment: ${paymentMethod}. You will be prompted to complete your payment via the ${paymentMethod} interface.`;
      responseTitle = "Order Pending Payment";
      paymentStatus = 'Pending';
      orderStatus = 'Pending';
    } else {
       console.warn(`[API /api/orders/create] Invalid payment method selected: ${paymentMethod}`);
       return NextResponse.json({ title: "Payment Failed", message: 'Invalid payment method selected.' }, { status: 400 });
    }

    const orderId = `PP-MOCK-${Date.now()}`; // Mock order ID generation

    const newOrder: Order = {
      id: orderId,
      userId: userId, // Use provided userId
      items: cartItems,
      totalAmount: orderTotal,
      currency: 'NPR', // Assuming NPR for now
      status: orderStatus,
      shippingAddress: { // Ensure OrderAddress type compliance
        street: streetAddress,
        city: city,
        postalCode: postalCode,
        country: country,
        fullName: fullName,
        phone: phone || undefined, // Use undefined if empty
        state: shippingDetails.isInternational ? undefined : country, // Simplified 'state' for Nepal
        apartmentSuite: apartmentSuite || undefined,
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log(`[API /api/orders/create] New order object to be saved:`, JSON.stringify(newOrder, null, 2));

    const orders = await getOrders();
    orders.push(newOrder);
    await saveOrders(orders);
    
    console.log(`[API /api/orders/create] Order ${orderId} saved successfully to orders.json for user ${userId}.`);
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
