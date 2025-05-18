
"use client";

import { useState, useEffect } from 'react';
import type { Order } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag, Eye, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/account/orders');
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError((err as Error).message || 'Could not load orders.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
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
    return (
      <div className="container-wide section-padding text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide section-padding text-center text-destructive">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Try Again</Button>
      </div>
    );
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
                        {/* TODO: Create individual order detail page /account/orders/[orderId] */}
                        <Link href={`/account/orders/#${order.id}`}>{order.id}</Link>
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
                           {/* TODO: Create individual order detail page /account/orders/[orderId] */}
                          <Link href={`/account/orders/#${order.id}`}>
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
              <p className="text-2xl font-semibold text-foreground mb-2">No Orders Yet</p>
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
