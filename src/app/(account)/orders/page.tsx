
"use client";

import { useState, useEffect } from 'react';
import type { Order } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.id) {
        setIsLoading(false);
        if (!authLoading) setError("Please log in to view your orders.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/account/orders?userId=${user.id}`);
        if (!response.ok) {
          let errorDetail = "Failed to fetch orders.";
          try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Error ${response.status}: ${response.statusText}`;
          } catch (e) { /* ignore if not json */ }
          throw new Error(errorDetail);
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error("[OrdersPage] Error fetching orders:", err);
        const errorMessage = (err as Error).message || 'Could not load orders.';
        setError(errorMessage);
        toast({ title: "Error Loading Orders", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) { 
      fetchOrders();
    } else if (!authLoading && !user) {
      setIsLoading(false);
      setError("User not authenticated.");
       toast({ title: "Authentication Required", description: "Please log in to view your orders.", variant: "default" });
    }
  }, [user, authLoading, toast]);

  const getOrderStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Delivered': return 'default'; 
      case 'Shipped': return 'secondary';
      case 'Processing': return 'outline'; 
      case 'Pending': return 'outline';
      case 'Cancelled': return 'destructive';
      case 'Refunded': return 'destructive';
      default: return 'secondary';
    }
  };
  
  const getPaymentStatusBadgeVariant = (status: Order['paymentStatus']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid': return 'default'; 
      case 'Pending': return 'outline';
      case 'Failed': return 'destructive';
      case 'Refunded': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="container-wide section-padding text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (error && !orders.length) { // Show error only if no orders are loaded
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
          </div>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Order Status</TableHead>
                    <TableHead className="text-center">Payment Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30" id={order.id}>
                      <TableCell className="font-medium text-primary">
                         {order.id.substring(0,15)}...
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {order.items.slice(0, 1).map(item => (
                             <Image key={item.id} src={item.imageUrl || `https://placehold.co/40x40.png`} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint={item.dataAiHint || "product fashion"}/>
                          ))}
                          <span className="text-sm">
                            {order.items[0].name}
                            {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">रू{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                            variant={getOrderStatusBadgeVariant(order.status)}
                            className={order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 border-green-500/30' :
                                      order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' :
                                      order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                                      order.status === 'Pending' ? 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-700/20 dark:text-slate-300 dark:border-slate-700/30' :
                                      ''}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-center">
                        <Badge 
                            variant={getPaymentStatusBadgeVariant(order.paymentStatus)}
                            className={order.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30' :
                                      order.paymentStatus === 'Failed' || order.paymentStatus === 'Refunded' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                                      order.paymentStatus === 'Pending' ? 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-700/20 dark:text-slate-300 dark:border-slate-700/30' :
                                      ''}
                        >
                          {order.paymentStatus}
                        </Badge>
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
