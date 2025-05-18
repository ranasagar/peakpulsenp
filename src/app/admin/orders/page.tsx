
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types';
import { Eye, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError((err as Error).message);
      toast({ title: "Error Fetching Orders", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []); // Removed toast from dependencies here

  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Delivered': return 'default'; // Green-like with primary
      case 'Shipped': return 'secondary'; // Blue-like
      case 'Processing': return 'outline'; // Yellow-like
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


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><ShoppingBag className="mr-3 h-6 w-6"/>Customer Orders</CardTitle>
          <CardDescription>Loading order data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl flex items-center"><ShoppingBag className="mr-3 h-6 w-6"/>Customer Orders</CardTitle>
          <CardDescription>View and manage customer orders. ({orders.length} total)</CardDescription>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-destructive mb-4 p-4 border border-destructive bg-destructive/10 rounded-md">
            <p><strong>Error:</strong> {error}</p>
            <p>Orders are saved to a local JSON file in this demo. Ensure the API route has write permissions if running locally outside of a read-only environment.</p>
          </div>
        )}
        {orders.length === 0 && !error ? (
          <p className="text-muted-foreground text-center py-8">No orders found yet. Orders created through the checkout will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total (NPR)</TableHead>
                  <TableHead className="text-center">Order Status</TableHead>
                  <TableHead className="text-center">Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-primary hover:underline">{order.id}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{order.shippingAddress.fullName}</TableCell>
                    <TableCell>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                    <TableCell className="text-right font-semibold">रू{order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(order.status)}
                         className={order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-center">
                      <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}
                        className={order.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled> {/* TODO: Implement order detail view */}
                        <Eye className="mr-1.5 h-3 w-3" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
