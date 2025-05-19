
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderStatus } from '@/types';
import { ALL_ORDER_STATUSES } from '@/types'; // Import defined statuses
import { Loader2, RefreshCw, ShoppingBag, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);

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
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setEditingOrder(orders.find(o => o.id === orderId) || null);
    setSelectedStatus(newStatus);
  };

  const confirmStatusUpdate = async () => {
    if (!editingOrder || !selectedStatus) return;

    try {
      const response = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }
      toast({ title: "Order Status Updated", description: `Order ${editingOrder.id} status changed to ${selectedStatus}.`, action: <CheckCircle className="text-green-500"/> });
      fetchOrders(); // Refresh the orders list
    } catch (err) {
      toast({ title: "Update Failed", description: (err as Error).message, variant: "destructive", action: <XCircle className="text-red-500"/> });
    } finally {
      setEditingOrder(null);
      setSelectedStatus(undefined);
    }
  };


  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'Shipped': return 'secondary';
      case 'Processing': return 'outline';
      case 'Pending': return 'outline'; // Same as processing for now
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

  if (isLoading && !error) { // Show loader only if no error
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
    <>
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
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total (NPR)</TableHead>
                    <TableHead className="text-center">Order Status</TableHead>
                    <TableHead className="text-center">Payment Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-primary hover:underline">{order.id}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{order.shippingAddress.fullName}</TableCell>
                      <TableCell className="text-center">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                      <TableCell className="text-right font-semibold">रू{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(order.status)}
                          className={order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                                     order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' :
                                     order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                                     order.status === 'Pending' ? 'bg-gray-500/20 text-gray-700 border-gray-500/30' :
                                     ''
                                    }
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
                      <TableCell className="text-center">
                         <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => { setEditingOrder(order); setSelectedStatus(order.status); }}>
                              <Edit className="mr-1.5 h-3 w-3" /> Status
                           </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingOrder && (
         <AlertDialog open={!!editingOrder} onOpenChange={(open) => { if(!open) {setEditingOrder(null); setSelectedStatus(undefined);}}}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Update Status for Order {editingOrder.id}</AlertDialogTitle>
                <AlertDialogDescription>
                    Select the new status for this order. This action will update the order details.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                <Select onValueChange={(value) => setSelectedStatus(value as OrderStatus)} defaultValue={editingOrder.status}>
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                    {ALL_ORDER_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setEditingOrder(null); setSelectedStatus(undefined); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmStatusUpdate} disabled={!selectedStatus || selectedStatus === editingOrder.status}>
                    Update Status
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      )}
    </>
  );
}
