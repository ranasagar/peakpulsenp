
// /src/app/api/orders/create/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CartItem } from '@/types'; // Assuming CheckoutFormValues is also in types or imported here

// Define an interface for the expected shipping details within the payload
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
  // Card details are optional and part of this if paymentMethod is card_international
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

    // Log received data (in a real app, validate and process this)
    console.log('Received order payload:', JSON.stringify(payload, null, 2));

    const { cartItems, shippingDetails, orderSubtotal, shippingCost, orderTotal } = payload;
    const { paymentMethod, country } = shippingDetails;

    // --- Mock Payment Processing Logic ---
    let responseMessage = `Order received for ${shippingDetails.fullName}. Total: रू${orderTotal.toLocaleString()}.`;
    const mockOrderId = `PP-MOCK-${Date.now()}`;

    if (paymentMethod === 'cod') {
      responseMessage += ' Payment: Cash on Delivery. A 10% advance hold procedure would be initiated by our team contacting you.';
      console.log(`Mock COD Order ${mockOrderId}: 10% hold would be initiated. Shipping to ${country}.`);
    } else if (paymentMethod === 'card_international') {
      responseMessage += ` Payment: International Card. Shipping fee: रू${shippingCost.toLocaleString()}.`;
      console.log(`Mock Int'l Card Order ${mockOrderId}: Processing international card. Total: रू${orderTotal}. Shipping to ${shippingDetails.internationalDestinationCountry}.`);
      // Simulate card validation if details were passed (they might be for some flows)
      if (shippingDetails.cardNumber) {
        console.log(`Card ending with ${shippingDetails.cardNumber.slice(-4)} would be processed.`);
      }
    } else if (paymentMethod === 'card_nepal') {
      responseMessage += ' Payment: Nepal Card. You would be redirected to a local payment gateway.';
      console.log(`Mock Nepal Card Order ${mockOrderId}: Redirecting to local payment gateway for card_nepal.`);
    } else {
      // Generic handling for other Nepali payment methods
      responseMessage += ` Payment: ${paymentMethod}. You would be redirected/prompted to complete payment via ${paymentMethod}.`;
      console.log(`Mock Order ${mockOrderId}: Initiating payment via ${paymentMethod}.`);
    }

    // In a real application, you would:
    // 1. Validate all data thoroughly.
    // 2. Check product inventory.
    // 3. For actual card payments:
    //    - If PCI compliant: Process directly with a payment processor (e.g., Stripe, Cybersource).
    //    - If not PCI compliant (common): Use a tokenization system or redirect to the payment gateway's hosted page.
    // 4. For Nepali gateways (eSewa, Khalti, etc.):
    //    - Integrate their respective SDKs/APIs.
    //    - Initiate payment requests, handle redirects, and verify callbacks/webhooks.
    // 5. Create an order record in your database with a unique order ID.
    // 6. Send order confirmation emails/SMS.
    // 7. Update inventory.

    return NextResponse.json({ message: responseMessage, orderId: mockOrderId }, { status: 201 });

  } catch (error) {
    console.error('Error processing order:', error);
    let errorMessage = 'Failed to process order.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Error processing order.', error: errorMessage }, { status: 500 });
  }
}
