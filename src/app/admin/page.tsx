
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit3, Users, ShoppingBag, FileText, AlertTriangle, ListOrdered, BookOpenText, BarChart3, DollarSign, TrendingUp, Percent } from 'lucide-react';
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabaseClient';
import type { Order, CartItem } from '@/types';

async function getSupabaseCount(tableName: string): Promise<number | string> {
  if (!supabase) {
    console.error(`[AdminDashboard] Supabase client not available for counting ${tableName}.`);
    return 'N/A';
  }
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error(`[AdminDashboard] Error counting ${tableName} from Supabase:`, error.message);
      return 'Error';
    }
    return count ?? 0;
  } catch (error) {
    console.error(`[AdminDashboard] Exception counting ${tableName} from Supabase:`, (error as Error).message);
    return 'Error';
  }
}

async function getContentFileStatus(fileName: string): Promise<'Managed' | 'Not Found' | 'Error'> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', fileName);
    await fs.access(filePath);
    return 'Managed';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'Not Found';
    }
    console.error(`Error checking ${fileName}:`, error);
    return 'Error';
  }
}

async function getSalesMetrics(): Promise<{
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number;
  averageOrderValue: number;
  orderCountForMetrics: number;
}> {
  if (!supabase) {
    console.error("[AdminDashboard] Supabase client not available for sales metrics.");
    return { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, grossProfitMargin: 0, averageOrderValue: 0, orderCountForMetrics: 0 };
  }

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('totalAmount, items, status')
      .in('status', ['Shipped', 'Delivered']); // Consider only completed orders for revenue and COGS

    if (error) {
      console.error("[AdminDashboard] Error fetching orders for sales metrics:", error.message);
      return { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, grossProfitMargin: 0, averageOrderValue: 0, orderCountForMetrics: 0 };
    }

    if (!orders || orders.length === 0) {
      return { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, grossProfitMargin: 0, averageOrderValue: 0, orderCountForMetrics: 0 };
    }

    let totalRevenue = 0;
    let totalCOGS = 0;

    orders.forEach(order => {
      totalRevenue += Number(order.totalAmount || 0);
      const items = order.items as CartItem[] | null; // Type assertion
      if (items) {
        items.forEach(item => {
          totalCOGS += (item.costPrice || 0) * item.quantity;
        });
      }
    });
    
    const orderCountForMetrics = orders.length;
    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = orderCountForMetrics > 0 ? totalRevenue / orderCountForMetrics : 0;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossProfitMargin,
      averageOrderValue,
      orderCountForMetrics,
    };
  } catch (e) {
    console.error("[AdminDashboard] Exception calculating sales metrics:", (e as Error).message);
    return { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, grossProfitMargin: 0, averageOrderValue: 0, orderCountForMetrics: 0 };
  }
}


export default async function AdminDashboardPage() {
  const productCount = await getSupabaseCount('products');
  const orderCount = await getSupabaseCount('orders');
  const userCount = await getSupabaseCount('users');
  const homepageContentStatus = await getContentFileStatus('homepage-content.json');
  const ourStoryContentStatus = await getContentFileStatus('our-story-content.json');
  const salesMetrics = await getSalesMetrics();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>Manage your Peak Pulse application from here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Data Overview Cards */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Products</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{productCount}</p><p className="text-xs text-muted-foreground">Total products</p><Link href="/admin/products" className="text-primary hover:underline text-xs mt-1 block">Manage Products &rarr;</Link></CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-primary"/>Orders</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{orderCount}</p><p className="text-xs text-muted-foreground">Total orders</p><Link href="/admin/orders" className="text-primary hover:underline text-xs mt-1 block">View Orders &rarr;</Link></CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Users</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{userCount}</p><p className="text-xs text-muted-foreground">Total users</p><p className="text-xs text-accent mt-1">User management UI not yet built.</p></CardContent>
            </Card>
            {/* Content Management Cards */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Homepage Content</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-semibold ${homepageContentStatus === 'Managed' ? 'text-green-600' : 'text-amber-600'}`}>{homepageContentStatus}</p><Link href="/admin/content/homepage" className="text-primary hover:underline text-xs mt-1 block">Edit Homepage &rarr;</Link></CardContent>
            </Card>
             <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><BookOpenText className="mr-2 h-5 w-5 text-primary"/>Our Story Content</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-semibold ${ourStoryContentStatus === 'Managed' ? 'text-green-600' : 'text-amber-600'}`}>{ourStoryContentStatus}</p><Link href="/admin/content/our-story" className="text-primary hover:underline text-xs mt-1 block">Edit Our Story &rarr;</Link></CardContent>
            </Card>
             <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Site Analytics (AI)</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-semibold text-blue-600">Demo Feature</p><Link href="/admin/analytics" className="text-primary hover:underline text-xs mt-1 block">View AI Analytics &rarr;</Link></CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><DollarSign className="mr-2 h-6 w-6 text-green-500"/>Sales &amp; Profitability Summary</CardTitle>
            <CardDescription>Based on orders marked as 'Shipped' or 'Delivered'. COGS calculated from item cost at time of sale.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-green-500/10 border-green-500/30">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-green-700">Total Revenue</p>
                    <TrendingUp className="h-5 w-5 text-green-600"/>
                </div>
                <p className="text-2xl font-bold text-green-700">रू{salesMetrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </Card>
            <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-amber-700">Total COGS</p>
                    <DollarSign className="h-5 w-5 text-amber-600"/>
                </div>
                <p className="text-2xl font-bold text-amber-700">रू{salesMetrics.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </Card>
            <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-700">Gross Profit</p>
                    <TrendingUp className="h-5 w-5 text-blue-600"/>
                </div>
                <p className="text-2xl font-bold text-blue-700">रू{salesMetrics.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </Card>
             <Card className="p-4 bg-purple-500/10 border-purple-500/30">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-purple-700">Gross Profit Margin</p>
                    <Percent className="h-5 w-5 text-purple-600"/>
                </div>
                <p className="text-2xl font-bold text-purple-700">{salesMetrics.grossProfitMargin.toFixed(2)}%</p>
            </Card>
            <Card className="p-4 bg-indigo-500/10 border-indigo-500/30">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-indigo-700">Average Order Value</p>
                    <ShoppingBag className="h-5 w-5 text-indigo-600"/>
                </div>
                <p className="text-2xl font-bold text-indigo-700">रू{salesMetrics.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </Card>
             <Card className="p-4 bg-gray-500/10 border-gray-500/30">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700">Completed Orders</p>
                    <ListOrdered className="h-5 w-5 text-gray-600"/>
                </div>
                <p className="text-2xl font-bold text-gray-700">{salesMetrics.orderCountForMetrics}</p>
            </Card>
        </CardContent>
      </Card>

       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-destructive">Important Note on this Admin Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            This admin section is a demonstration.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>**Authentication &amp; Authorization:** This section currently lacks robust security. In a real app, access must be strictly controlled based on user roles.</li>
            <li>**Data Management:**
                <ul>
                    <li>Product, Order, and User data are managed via **Supabase**.</li>
                    <li>Homepage and "Our Story" page content are still managed via **JSON files**. This file-writing approach will **not work in most production/serverless hosting environments** like Vercel due to read-only filesystems. A proper database or Headless CMS is recommended for all dynamic page content in production.</li>
                </ul>
            </li>
            <li>**Accounting Features:** The sales summary is basic. Full accounting requires specialized systems. COGS accuracy depends on `costPrice` being diligently maintained for products and recorded correctly at the time of sale.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
