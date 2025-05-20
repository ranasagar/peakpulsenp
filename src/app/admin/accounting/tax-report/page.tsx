
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker'; // Assume this component will be created or exists
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Helper function to generate CSV
function exportToCsv(filename: string, rows: object[]) {
  if (!rows || !rows.length) {
    return;
  }
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
        cell = cell instanceof Date
          ? cell.toLocaleString()
          : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

interface SalesReportSummary {
  totalSales: number;
  numberOfOrders: number;
  period: string;
}

export default function AdminTaxReportPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<SalesReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSalesData = async () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      toast({ title: "Error", description: "Please select a valid date range.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setOrders([]);
    setSummary(null);

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    try {
      const response = await fetch(`/api/admin/accounting/sales-data?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch sales data (${response.status})`);
      }
      const fetchedOrders: Order[] = await response.json();
      setOrders(fetchedOrders);

      const totalSales = fetchedOrders.reduce((acc, order) => acc + order.totalAmount, 0);
      setSummary({
        totalSales,
        numberOfOrders: fetchedOrders.length,
        period: `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
      });

      toast({ title: "Data Fetched", description: `Found ${fetchedOrders.length} orders for the selected period.` });
    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast({ title: "No Data", description: "No data to export. Fetch data first.", variant: "default" });
      return;
    }
    const dataToExport = orders.map(order => ({
      orderId: order.id,
      createdAt: format(new Date(order.createdAt), "yyyy-MM-dd HH:mm"),
      customerName: order.shippingAddress.fullName,
      totalAmount: order.totalAmount,
      currency: order.currency,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || 'N/A',
      // For more detailed tax reports, you might include item details, tax amounts (if applicable), etc.
    }));
    exportToCsv(`peakpulse-sales-report-${dateRange?.from ? format(dateRange.from, "yyyyMMdd") : ''}-${dateRange?.to ? format(dateRange.to, "yyyyMMdd") : ''}.csv`, dataToExport);
  };
  
  const getOrderStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    // ... (copy from /admin/orders/page.tsx)
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
    // ... (copy from /admin/orders/page.tsx)
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'outline';
      case 'Failed': return 'destructive';
      case 'Refunded': return 'destructive';
      default: return 'secondary';
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <FileText className="mr-3 h-6 w-6 text-primary" />
            Sales Data Export for Tax Reporting (Nepal)
          </CardTitle>
          <CardDescription>
            Select a date range to fetch sales data. This data can be used as a reference for tax filing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <DatePickerWithRange onDateChange={setDateRange} selectedDateRange={dateRange} />
            <Button onClick={fetchSalesData} disabled={isLoading || !dateRange?.from || !dateRange?.to} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Fetch Sales Data
            </Button>
          </div>
          <Card className="bg-destructive/10 border-destructive/30 p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-destructive mr-3 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-destructive">Disclaimer</p>
                    <p className="text-xs text-destructive/80">
                        This report provides a summary of sales data for your reference. It is NOT an official tax document. 
                        Please consult with a qualified tax professional in Nepal for accurate tax filing and compliance. 
                        This tool does not calculate VAT or other specific Nepali taxes.
                    </p>
                </div>
              </div>
          </Card>
        </CardContent>
      </Card>

      {summary && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>For the period: {summary.period}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Sales Revenue</p>
              <p className="text-2xl font-bold text-primary">रू{summary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">Number of Orders</p>
              <p className="text-2xl font-bold text-primary">{summary.numberOfOrders}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detailed Order List</CardTitle>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total (NPR)</TableHead>
                    <TableHead className="text-center">Order Status</TableHead>
                    <TableHead className="text-center">Payment Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), "yyyy-MM-dd HH:mm")}</TableCell>
                      <TableCell>{order.shippingAddress.fullName}</TableCell>
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
                        >{order.status}</Badge>
                      </TableCell>
                       <TableCell className="text-center">
                        <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}
                           className={
                            order.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                            order.paymentStatus === 'Pending' ? 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-700/20 dark:text-slate-300 dark:border-slate-700/30' :
                            order.paymentStatus === 'Failed' || order.paymentStatus === 'Refunded' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                            ''
                           }
                        >{order.paymentStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {isLoading && !orders.length && !summary && (
         <Card><CardContent className="py-10 text-center text-muted-foreground">Fetching data...</CardContent></Card>
      )}
       {!isLoading && orders.length === 0 && dateRange?.from && dateRange?.to && (
         <Card><CardContent className="py-10 text-center text-muted-foreground">No orders found for the selected period.</CardContent></Card>
      )}
    </div>
  );
}
