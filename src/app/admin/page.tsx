
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText, ShoppingBag, BarChart3, ListOrdered, Landmark, Tags, Users, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient'; // Adjusted to correct path alias
import fs from 'fs/promises';
import path from 'path';
import { Button } from '@/components/ui/button'; // Added Button import

// Helper function to check file status without Supabase interaction
async function getContentFileStatus(contentKey: string): Promise<'JSON (Okay)' | 'JSON (Not Found)' | 'JSON (Error)'> {
  const filePath = path.join(process.cwd(), 'src', 'data', `${contentKey}-content.json`);
  try {
    await fs.access(filePath);
    return 'JSON (Okay)';
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return 'JSON (Not Found)';
    }
    console.error(`[AdminDashboard] Error accessing/parsing ${contentKey}.json:`, error.message);
    return 'JSON (Error)';
  }
}

async function getSupabaseCount(tableName: string): Promise<string | number> {
  if (!supabase) {
    console.warn(`[AdminDashboard] Supabase client not available for counting ${tableName}.`);
    return 'N/A (DB Client Error)';
  }
  try {
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`[AdminDashboard] Error counting ${tableName}:`, error);
      return 'N/A (DB Query Error)';
    }
    return count ?? 0;
  } catch (e) {
    console.error(`[AdminDashboard] Exception counting ${tableName}:`, e);
    return 'N/A (Exception)';
  }
}


export default async function AdminDashboardPage() {
  const productCount = await getSupabaseCount('products');
  const orderCount = await getSupabaseCount('orders');
  const userCount = await getSupabaseCount('users');
  const categoryCount = await getSupabaseCount('categories');
  const loanCount = await getSupabaseCount('loans');


  const homepageContentStatus = await getContentFileStatus('homepage');
  const ourStoryContentStatus = await getContentFileStatus('our-story');

  // Placeholder for sales metrics - these would typically be calculated from 'orders' table
  const salesMetrics = {
    totalRevenue: 0, // Placeholder, replace with actual calculation
    totalCOGS: 0,    // Placeholder
    grossProfit: 0,  // Placeholder
    grossProfitMargin: 0, // Placeholder
    averageOrderValue: 0, // Placeholder
    orderCountForMetrics: 0, // Placeholder
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>Manage your Peak Pulse application. Data for Products, Orders, Users, Categories, and Loans is from Supabase.</CardDescription>
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
              <CardContent><p className="text-3xl font-bold">{userCount}</p><p className="text-xs text-muted-foreground">User profiles (from Supabase)</p><p className="text-xs text-accent mt-1">Basic user count displayed. Full user management features would require further development (e.g., roles, permissions).</p></CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Homepage Content</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-semibold ${homepageContentStatus.includes('Okay') ? 'text-green-600' : 'text-amber-600'}`}>{homepageContentStatus}</p><p className="text-xs text-muted-foreground">(JSON file based)</p><Link href="/admin/content/homepage" className="text-primary hover:underline text-xs mt-1 block">Edit Homepage &rarr;</Link></CardContent>
            </Card>
             <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><BookOpenText className="mr-2 h-5 w-5 text-primary"/>Our Story Content</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-semibold ${ourStoryContentStatus.includes('Okay') ? 'text-green-600' : 'text-amber-600'}`}>{ourStoryContentStatus}</p><p className="text-xs text-muted-foreground">(JSON file based)</p><Link href="/admin/content/our-story" className="text-primary hover:underline text-xs mt-1 block">Edit Our Story &rarr;</Link></CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><Landmark className="mr-2 h-6 w-6 text-green-500"/>Accounting Overview</CardTitle>
            <CardDescription>Sales and profitability summary. COGS calculated from item costPrice at time of sale.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-green-100 dark:bg-green-500/10 border-green-300 dark:border-green-500/30">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</p>
                    <ListOrdered className="h-5 w-5 text-green-600 dark:text-green-400"/>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-200">{salesMetrics.orderCountForMetrics} Orders</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-200 mt-1">रू{salesMetrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </Card>
            <Card className="p-4 bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total COGS</p>
                    <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400"/>
                </div>
                 <p className="text-xs text-muted-foreground">(from Shipped/Delivered orders)</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-200 mt-1">रू{salesMetrics.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </Card>
            <Card className="p-4 bg-blue-100 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Gross Profit</p>
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                </div>
                <p className="text-xs text-muted-foreground">(Revenue - COGS)</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-200 mt-1">रू{salesMetrics.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 <p className={`text-sm font-semibold mt-1 ${salesMetrics.grossProfitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Margin: {salesMetrics.grossProfitMargin.toFixed(2)}%
                 </p>
            </Card>
             <div className="lg:col-span-3 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/accounting/loans" className="text-sm text-primary hover:underline flex items-center p-3 border rounded-md hover:bg-primary/5">
                    <Landmark className="mr-2 h-4 w-4" /> Manage Loans ({loanCount})
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
          <CardTitle className="text-xl text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5"/>Important Note on this Admin Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            This admin panel uses Supabase for Products, Categories, Orders, Users, and Loans. Some page content (Homepage, Our Story) is still managed via local JSON files for demonstration.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>**Supabase Connection:** Ensure your <code>.env</code> file has the correct Supabase URL and Anon Key, and that your Next.js server has been restarted after any changes.</li>
            <li>**Security:** This admin section currently lacks robust role-based authentication & authorization. Access must be strictly controlled in a production environment.</li>
            <li>**JSON Content Management:** Managing some content via JSON files is not scalable and will not work in most serverless production environments like Vercel due to read-only filesystems. Migrating this content to Supabase or a headless CMS is recommended for production.</li>
            <li>**Accounting Features:** The sales summary and tax data export are for informational purposes. Full accounting requires specialized systems.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

