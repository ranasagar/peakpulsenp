
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit3, Users, ShoppingBag, FileText, AlertTriangle, ListOrdered, BookOpenText, BarChart3, DollarSign, TrendingUp, Percent, Landmark, Tags } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient.ts'; // Ensure correct path if using alias
import type { Order, CartItem } from '@/types';

async function getSupabaseCount(tableName: string): Promise<number | string> {
  if (!supabase) {
    console.error(`[AdminDashboard] Supabase client not available for counting ${tableName}.`);
    return 'N/A (DB Error)';
  }
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error(`[AdminDashboard] Error counting ${tableName} from Supabase:`, error);
      if (error.message.includes("permission denied") || error.message.includes("policy")) {
        return `RLS?`;
      }
      return `Error`;
    }
    return count ?? 0;
  } catch (error) {
    console.error(`[AdminDashboard] Exception counting ${tableName} from Supabase:`, (error as Error).message);
    return 'Error (Exc.)';
  }
}

// This function is a placeholder as JSON file management is being phased out
async function getContentFileStatus(contentKey: string): Promise<'Managed by DB' | 'Not Found' | 'Error'> {
  // For this iteration, assume content sections like homepage and our-story will eventually be DB driven
  // For now, just return a placeholder status
  if (contentKey === 'homepage' || contentKey === 'our-story') {
      return 'Managed by DB'; // Placeholder for now
  }
  return 'Not Found';
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
      .in('status', ['Shipped', 'Delivered']);

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
      const items = order.items as CartItem[] | null;
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
  const categoryCount = await getSupabaseCount('categories'); // New
  const homepageContentStatus = await getContentFileStatus('homepage');
  const ourStoryContentStatus = await getContentFileStatus('our-story');
  const salesMetrics = await getSalesMetrics();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>Manage your Peak Pulse application. Data primarily from Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Products</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{productCount}</p><p className="text-xs text-muted-foreground">Total products</p><Link href="/admin/products" className="text-primary hover:underline text-xs mt-1 block">Manage Products &rarr;</Link></CardContent>
            </Card>
             <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Tags className="mr-2 h-5 w-5 text-primary"/>Categories</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{categoryCount}</p><p className="text-xs text-muted-foreground">Total categories</p><Link href="/admin/categories" className="text-primary hover:underline text-xs mt-1 block">Manage Categories &rarr;</Link></CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-primary"/>Orders</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{orderCount}</p><p className="text-xs text-muted-foreground">Total orders</p><Link href="/admin/orders" className="text-primary hover:underline text-xs mt-1 block">View Orders &rarr;</Link></CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Users</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{userCount}</p><p className="text-xs text-muted-foreground">Total user profiles</p><p className="text-xs text-accent mt-1">User management UI not yet built.</p></CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Homepage Content</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-semibold text-green-600`}>{homepageContentStatus}</p><Link href="/admin/content/homepage" className="text-primary hover:underline text-xs mt-1 block">Edit Homepage &rarr;</Link></CardContent>
            </Card>
             <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><BookOpenText className="mr-2 h-5 w-5 text-primary"/>Our Story Content</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-semibold text-green-600`}>{ourStoryContentStatus}</p><Link href="/admin/content/our-story" className="text-primary hover:underline text-xs mt-1 block">Edit Our Story &rarr;</Link></CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><Landmark className="mr-2 h-6 w-6 text-green-500"/>Accounting Overview</CardTitle>
            <CardDescription>Sales and profitability summary based on 'Shipped' or 'Delivered' orders. COGS calculated from item cost at time of sale (if available in order data).</CardDescription>
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
             <div className="lg:col-span-3 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/accounting/loans" className="text-sm text-primary hover:underline flex items-center p-3 border rounded-md hover:bg-primary/5">
                    <Landmark className="mr-2 h-4 w-4" /> Manage Loans
                </Link>
                <Link href="/admin/accounting/tax-report" className="text-sm text-primary hover:underline flex items-center p-3 border rounded-md hover:bg-primary/5">
                    <FileText className="mr-2 h-4 w-4" /> Sales Data Export for Tax
                </Link>
             </div>
        </CardContent>
      </Card>
       <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Site Analytics (AI Demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate AI-powered summaries and recommendations based on mock site performance metrics.
            </p>
            <Button asChild>
              <Link href="/admin/analytics">View AI Analytics &rarr;</Link>
            </Button>
          </CardContent>
        </Card>

       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5"/>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            This admin panel is a demonstration. For production, consider the following:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>**Security:** This section currently lacks robust authentication & authorization for specific admin roles. Access must be strictly controlled in a production environment.</li>
            <li>**Data Management:** Product, Order, User, and Category data are now managed via **Supabase**. Homepage and "Our Story" page content still use JSON files for this demo; for production, migrating these to Supabase or a headless CMS is recommended for scalability and to avoid issues with read-only filesystems on platforms like Vercel.</li>
            <li>**Accounting Features:** The sales summary and tax data export are for informational purposes. Full accounting requires specialized systems. COGS accuracy depends on `costPrice` being diligently maintained.</li>
            <li>**Error Handling & Scalability:** Production systems require more comprehensive error handling, input validation, and infrastructure designed for scalability.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
