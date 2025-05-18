
// /src/app/api/account/orders/route.ts
import { NextResponse } from 'next/server';
import type { Order } from '@/types';

// Mock Data - In a real app, this would come from a database, filtered by user ID
const mockUserOrders: Order[] = [
  {
    id: 'ORD-001', userId: 'user-cust-123', // Example user ID
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 12000, currency: 'NPR', status: 'Shipped',
    items: [{ id: 'item-1', productId: 'prod-1', name: 'Himalayan Breeze Jacket', quantity: 1, price: 12000, imageUrl: 'https://placehold.co/50x50.png', dataAiHint: 'jacket fashion' }],
    shippingAddress: { fullName: 'Valued Customer', street: '123 Dharma Path', city: 'Kathmandu', postalCode: '44600', country: 'Nepal' },
    paymentStatus: 'paid',
  },
  {
    id: 'ORD-002', userId: 'user-cust-123',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 11000, currency: 'NPR', status: 'Delivered',
    items: [
      { id: 'item-2', productId: 'prod-2', name: 'Kathmandu Comfort Tee', quantity: 2, price: 3500, imageUrl: 'https://placehold.co/50x50.png', dataAiHint: 'tee shirt' },
      { id: 'item-3', productId: 'prod-5', name: 'Artisan Keychain', quantity: 1, price: 4000, imageUrl: 'https://placehold.co/50x50.png', dataAiHint: 'keychain craft' }
    ],
    shippingAddress: { fullName: 'Valued Customer', street: '123 Dharma Path', city: 'Kathmandu', postalCode: '44600', country: 'Nepal' },
    paymentStatus: 'paid',
  },
  {
    id: 'ORD-003', userId: 'user-cust-123',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 7500, currency: 'NPR', status: 'Processing',
    items: [{ id: 'item-4', productId: 'prod-3', name: 'Urban Nomad Pants', quantity: 1, price: 7500, imageUrl: 'https://placehold.co/50x50.png', dataAiHint: 'pants fashion' }],
    shippingAddress: { fullName: 'Valued Customer', street: '123 Dharma Path', city: 'Kathmandu', postalCode: '44600', country: 'Nepal' },
    paymentStatus: 'paid',
  },
];

export async function GET() {
  // In a real application, you would:
  // 1. Authenticate the user (e.g., check session, JWT token)
  // 2. Fetch orders for that specific user from your database
  // For now, we'll return all mock orders.
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json(mockUserOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Error fetching orders', error: (error as Error).message }, { status: 500 });
  }
}
