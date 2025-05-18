
"use client";

import { useState, useEffect } from 'react';
import type { Order } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag, Eye } from 'lucide-react';
import Image from 'next/image';

// Mock Data - Replace with actual data fetching
const mockOrders: Order[] = [
  { 
    id: 'ORD-001', userId: 'user-cust-123', 
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
    totalAmount: 12000, currency: 'NPR', status: 'Shipped', 
    items: [{ productId: 'prod-1', name: 'Himalayan Breeze Jacket', quantity: 1, price: 12000, imageUrl: 'https://placehold.co/50x50.png', id: 'item-1', dataAiHint: 'jacket fashion' }],
    shippingAddress: { fullName: 'Valued Customer', street: '123 Dharma Path', city: 'Kathmandu', postalCode: '44600', country: 'Nepal' },
    paymentStatus: 'paid',
  },
  { 
    id: 'ORD-002', userId: 'user-cust-123', 
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    totalAmount: 11000, currency: 'NPR', status: 'Delivered', 
    items: [
      { productId: 'prod-2', name: 'Kathmandu Comfort Tee', quantity: 2, price: 3500, imageUrl: 'https://placehold.co/50x50.png', id: 'item-2', dataAiHint: 'tee shirt' },
      { productId: 'prod-5', name: 'Artisan Keychain', quantity: 1, price: 4000, imageUrl: 'https://placehold.co/50x50.png', id: 'item-3', dataAiHint: 'keychain craft' }
    ],
    shippingAddress: { fullName: 'Valued Customer', street: '123 Dharma Path', city: 'Kathmandu', postalCode: '44600', country: 'Nepal' },
    paymentStatus: 'paid',
  },
  { 
    id: 'ORD-003', userId: 'user-cust-123', 
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
    totalAmount: 7500, currency: 'NPR', status: 'Processing', 
    items: [{ productId: 'prod-3', name: 'Urban Nomad Pants', quantity: 1, price: 7500, imageUrl: 'https://placehold.co/50x50.png', id: 'item-4', dataAiHint: 'pants fashion' }],
    shippingAddress: { fullName: 'Valued Customer', street: '123 Dharma Path', city: 'Kathmandu', postalCode: '44600', country: 'Nepal' },
    paymentStatus: 'paid',
  },
];


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders);
      setIsLoading(false);
    }, 500);
  }, []);

  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Delivered': return 'default'; // Green-like with default primary
      case 'Shipped': return 'secondary'; // Blue-like
      case 'Processing': return 'outline'; // Yellow-like
      case 'Cancelled': return 'destructive';
      case 'Refunded': return 'destructive';
      default: return 'secondary';
    }
  };


  if (isLoading) {
    return <div className="container-wide section-padding text-center">Loading orders...</div>;
  }

  return (
    <div className="container-wide section-padding">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center text-foreground">
                <ShoppingBag className="mr-3 h-8 w-8 text-primary" />
                Your Orders
              </CardTitle>
              <CardDescription className="mt-1">Track and manage your past and current orders.</CardDescription>
            </div>
            {/* Optional: Add filters or search here */}
          </div>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-primary hover:underline">
                        <Link href={`/account/orders/${order.id}`}>{order.id}</Link>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {order.items.slice(0, 1).map(item => (
                             <Image key={item.id} src={item.imageUrl || `https://placehold.co/40x40.png`} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint={item.dataAiHint || "product fashion"}/>
                          ))}
                          <span>
                            {order.items[0].name}
                            {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">रू{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(order.status)} 
                               className={order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                                          order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' :
                                          order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                                          ''}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/account/orders/${order.id}`}>
                            <Eye className="mr-1.5 h-4 w-4" /> View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-foreground mb-2">No Orders Yet</p>
              <p className="text-muted-foreground mb-6">Looks like you haven&apos;t placed any orders. Start shopping to see them here!</p>
              <Button asChild>
                <Link href="/products">Shop Now</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    