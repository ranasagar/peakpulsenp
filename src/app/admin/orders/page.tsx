
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { ALL_ORDER_STATUSES, ALL_PAYMENT_STATUSES } from '@/types';
import { Loader2, RefreshCw, ShoppingBag, Edit, CheckCircle, XCircle, CreditCard } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [editingOrderStatusOrder, setEditingOrderStatusOrder] = useState<Order | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<OrderStatus | undefined>(undefined);
  const [isOrderStatusDialogOpen, setIsOrderStatusDialogOpen] = useState(false);

  const [editingPaymentStatusOrder, setEditingPaymentStatusOrder] = useState<Order | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | undefined>(undefined);
  const [isPaymentStatusDialogOpen, setIsPaymentStatusDialogOpen] = useState(false);


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

  const handleOpenOrderStatusDialog = (order: Order) => {
    setEditingOrderStatusOrder(order);
    setSelectedOrderStatus(order.status);
    setIsOrderStatusDialogOpen(true);
  };

  const confirmOrderStatusUpdate = async () => {
    if (!editingOrderStatusOrder || !selectedOrderStatus) return;

    try {
      const response = await fetch(`/api/admin/orders/${editingOrderStatusOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedOrderStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }
      toast({ title: "Order Status Updated", description: `Order ${editingOrderStatusOrder.id} status changed to ${selectedOrderStatus}.`, action: <CheckCircle className="text-green-500"/> });
      fetchOrders(); 
      setIsOrderStatusDialogOpen(false); 
    } catch (err) {
      toast({ title: "Update Failed", description: (err as Error).message, variant: "destructive", action: <XCircle className="text-red-500"/> });
    }
  };

  const handleOpenPaymentStatusDialog = (order: Order) => {
    setEditingPaymentStatusOrder(order);
    setSelectedPaymentStatus(order.paymentStatus);
    setIsPaymentStatusDialogOpen(true);
  };

  const confirmPaymentStatusUpdate = async () => {
    if (!editingPaymentStatusOrder || !selectedPaymentStatus) return;

    try {
      const response = await fetch(`/api/admin/orders/${editingPaymentStatusOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: selectedPaymentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment status');
      }
      toast({ title: "Payment Status Updated", description: `Order ${editingPaymentStatusOrder.id} payment status changed to ${selectedPaymentStatus}.`, action: <CheckCircle className="text-green-500"/> });
      fetchOrders(); 
      setIsPaymentStatusDialogOpen(false); 
    } catch (err) {
      toast({ title: "Update Failed", description: (err as Error).message, variant: "destructive", action: <XCircle className="text-red-500"/> });
    }
  };


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

  if (isLoading && !error) { 
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
                        <Badge variant={getOrderStatusBadgeVariant(order.status)}
                          className={
                            order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                            order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' :
                            order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                            order.status === 'Pending' ? 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-700/20 dark:text-slate-300 dark:border-slate-700/30' :
                            order.status === 'Cancelled' || order.status === 'Refunded' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                            ''
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}
                           className={
                            order.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                            order.paymentStatus === 'Pending' ? 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-700/20 dark:text-slate-300 dark:border-slate-700/30' :
                            order.paymentStatus === 'Failed' || order.paymentStatus === 'Refunded' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                            ''
                           }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                           <Button variant="outline" size="sm" onClick={() => handleOpenOrderStatusDialog(order)}>
                              <Edit className="mr-1.5 h-3 w-3" /> Order
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleOpenPaymentStatusDialog(order)}>
                              <CreditCard className="mr-1.5 h-3 w-3" /> Payment
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

      {/* Dialog for Order Status */}
      <AlertDialog 
        open={isOrderStatusDialogOpen} 
        onOpenChange={(open) => {
          setIsOrderStatusDialogOpen(open);
          if (!open) {
            setEditingOrderStatusOrder(null);
            setSelectedOrderStatus(undefined);
          }
        }}
      >
        <AlertDialogContent>
          {editingOrderStatusOrder ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Update Order Status for {editingOrderStatusOrder.id}</AlertDialogTitle>
                <AlertDialogDescription>
                  Select the new order status. This action will update the order details.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Select 
                  onValueChange={(value) => setSelectedOrderStatus(value as OrderStatus)} 
                  defaultValue={selectedOrderStatus || editingOrderStatusOrder.status}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new order status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ORDER_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmOrderStatusUpdate} disabled={!selectedOrderStatus || selectedOrderStatus === editingOrderStatusOrder.status}>
                  Update Order Status
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary"/>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for Payment Status */}
      <AlertDialog 
        open={isPaymentStatusDialogOpen} 
        onOpenChange={(open) => {
          setIsPaymentStatusDialogOpen(open);
          if (!open) {
            setEditingPaymentStatusOrder(null);
            setSelectedPaymentStatus(undefined);
          }
        }}
      >
        <AlertDialogContent>
          {editingPaymentStatusOrder ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Update Payment Status for {editingPaymentStatusOrder.id}</AlertDialogTitle>
                <AlertDialogDescription>
                  Select the new payment status. This action will update the order details.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Select 
                  onValueChange={(value) => setSelectedPaymentStatus(value as PaymentStatus)} 
                  defaultValue={selectedPaymentStatus || editingPaymentStatusOrder.paymentStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_PAYMENT_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmPaymentStatusUpdate} disabled={!selectedPaymentStatus || selectedPaymentStatus === editingPaymentStatusOrder.paymentStatus}>
                  Update Payment Status
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary"/>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
