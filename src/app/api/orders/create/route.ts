
// /src/app/api/orders/create/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CartItem, Order, OrderAddress, OrderStatus, PaymentStatus } from '@/types';
import fs from 'fs/promises';
import path from 'path';

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
    console.error('Error reading orders.json:', error);
    throw error; // Re-throw other errors
  }
}

// Helper function to save orders
async function saveOrders(orders: Order[]): Promise<void> {
  await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
}


// Luhn algorithm check function
function luhnCheck(val: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  const numStr = val.replace(/\D/g, ""); // Remove non-digits

  if (numStr.length < 13 || numStr.length > 19) return false; // Basic length check

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
  cartItems: CartItem[];
  shippingDetails: ShippingDetails;
  orderSubtotal: number;
  shippingCost: number;
  orderTotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CreateOrderPayload;
    console.log('Received order payload:', JSON.stringify(payload, null, 2));

    const { cartItems, shippingDetails, orderSubtotal, shippingCost, orderTotal } = payload;
    const { paymentMethod, country, cardNumber, expiryDate, cvc, cardholderName, streetAddress, city, postalCode, fullName, phone } = shippingDetails;

    let responseMessage = `Order for ${shippingDetails.fullName} (Total: रू${orderTotal.toLocaleString()}) received.`;
    let responseTitle = "Order Received (Mock)";
    const mockOrderId = `PP-MOCK-${Date.now()}`;
    let paymentStatus: PaymentStatus = 'Pending';
    let orderStatus: OrderStatus = 'Processing';


    // Payment Method Specific Logic (Mock)
    if (paymentMethod === 'cod') {
      responseMessage += ' Payment: Cash on Delivery. Our team will contact you regarding a potential 10% advance payment for order confirmation.';
      responseTitle = "COD Order Placed (Mock)";
      paymentStatus = 'Pending'; // COD is paid on delivery
      console.log(`Mock COD Order ${mockOrderId}: Potential 10% hold procedure. Shipping to ${country}.`);
    } else if (paymentMethod === 'card_international') {
      if (!cardNumber || !expiryDate || !cvc || !cardholderName) {
        return NextResponse.json({ title: "Payment Failed", message: 'Missing international card details.' }, { status: 400 });
      }
      if (!luhnCheck(cardNumber)) {
        return NextResponse.json({ title: "Payment Failed", message: 'Invalid credit card number (Luhn check failed).' }, { status: 400 });
      }
      const expiryMatch = expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/);
      if (!expiryMatch) {
        return NextResponse.json({ title: "Payment Failed", message: "Invalid expiry date format. Must be MM/YY." }, { status: 400 });
      }
      const [, month, year] = expiryMatch;
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      const inputYear = parseInt(year, 10);
      const inputMonth = parseInt(month, 10);
      if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
          return NextResponse.json({ title: "Payment Failed", message: "Card has expired." }, { status: 400 });
      }
      if (!/^\d{3,4}$/.test(cvc)) {
        return NextResponse.json({ title: "Payment Failed", message: "Invalid CVC. Must be 3 or 4 digits." }, { status: 400 });
      }

      responseMessage += ` Payment: International Card (ending ${cardNumber.slice(-4)}). Shipping fee: रू${shippingCost.toLocaleString()}.`;
      responseTitle = "International Order Placed (Mock)";
      paymentStatus = 'Paid'; // Assume payment successful for mock
      console.log(`Mock Int'l Card Order ${mockOrderId}: Card (ending ${cardNumber.slice(-4)}) would be processed. Total: रू${orderTotal}. Shipping to ${shippingDetails.internationalDestinationCountry}.`);
    } else if (paymentMethod === 'card_nepal') {
      responseMessage += ' Payment: Nepal Card. You will be redirected to a secure local payment gateway to complete your payment.';
      responseTitle = "Order Pending (Mock)";
      paymentStatus = 'Pending'; // User needs to complete payment on gateway
      console.log(`Mock Nepal Card Order ${mockOrderId}: Redirecting to local payment gateway for card_nepal.`);
    } else if (['esewa', 'khalti', 'imepay', 'connectips', 'qr', 'banktransfer'].includes(paymentMethod)) {
      responseMessage += ` Payment: ${paymentMethod}. You will be prompted to complete your payment via the ${paymentMethod} interface.`;
      responseTitle = "Order Pending (Mock)";
      paymentStatus = 'Pending';
      console.log(`Mock Order ${mockOrderId}: Initiating payment via ${paymentMethod}.`);
    } else {
       return NextResponse.json({ title: "Payment Failed", message: 'Invalid payment method selected.' }, { status: 400 });
    }

    const newOrder: Order = {
      id: mockOrderId,
      userId: 'mock-user-id', // In a real app, get this from authenticated session
      items: cartItems,
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
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // This file writing approach is NOT suitable for production serverless environments
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.warn("File system write attempts for orders are disabled in Vercel production environment for this demo API.");
      // Do not attempt to write if in Vercel production, just return success for demo
    } else {
      const allOrders = await getOrders();
      allOrders.push(newOrder);
      await saveOrders(allOrders);
    }


    return NextResponse.json({ title: responseTitle, message: responseMessage, orderId: mockOrderId }, { status: 201 });

  } catch (error) {
    console.error('Error processing order:', error);
    let errorMessage = 'Failed to process order.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ title: "Order Error", message: 'Error processing order.', error: errorMessage }, { status: 500 });
  }
}
