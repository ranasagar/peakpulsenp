import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText, ShoppingBag, BarChart3, ListOrdered, Landmark, Tags, Users, Settings, AlertTriangle, FileText, Palette, ImageIcon as ImageIconLucide, Printer, Home as HomeIcon, ListChecks, DollarSign, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

async function getSupabaseCount(tableName: string): Promise<string | number> {
  if (!supabase) {
    console.warn(`[AdminDashboard] Supabase client not available for counting ${tableName}. Check .env variables and server restart.`);
    return 'N/A (DB Client Error)';
  }
  try {
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`[AdminDashboard] Error counting ${tableName} in Supabase:`, error);
      let detail = error.message;
      if (error.details) detail += ` Details: ${error.details}`;
      if (error.hint) detail += ` Hint: ${error.hint}`;
      return `Error (DB: ${detail.substring(0, 50)}${detail.length > 50 ? '...' : ''})`;
    }
    return count ?? 0;
  } catch (e: any) {
    console.error(`[AdminDashboard] Exception counting ${tableName} in Supabase:`, e);
    return `N/A (Ex: ${e.message.substring(0, 30)})`;
  }
}

async function getSiteConfigurationStatus(configKey: string): Promise<string | 'Okay' | 'Not Found' | 'Error'> {
  if (!supabase) {
    return 'Error (DB Client)';
  }
  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('config_key')
      .eq('config_key', configKey)
      .maybeSingle();

    if (error) {
      console.error(`[AdminDashboard] Error checking Supabase config for ${configKey}:`, error);
      return 'Error (DB Query)';
    }
    return data ? 'Okay' : 'Not Found';
  } catch (e) {
    console.error(`[AdminDashboard] Exception checking Supabase config for ${configKey}:`, e);
    return 'Error (Exception)';
  }
}


export default async function AdminDashboardPage() {
  const productCount = await getSupabaseCount('products');
  const orderCount = await getSupabaseCount('orders');
  const userCount = await getSupabaseCount('users');
  const categoryCount = await getSupabaseCount('categories');
  const loanCount = await getSupabaseCount('loans');
  const collabCategoryCount = await getSupabaseCount('design_collaboration_categories');
  const galleryCount = await getSupabaseCount('design_collaborations');
  const printDesignCount = await getSupabaseCount('print_on_demand_designs');

  const homepageContentStatus = await getSiteConfigurationStatus('homepageContent');
  const ourStoryContentStatus = await getSiteConfigurationStatus('ourStoryContent');
  const generalSettingsStatus = await getSiteConfigurationStatus('siteGeneralSettings');
  const footerContentStatus = await getSiteConfigurationStatus('footerContent');


  let totalRevenue = 0;
  let totalCOGS = 0;
  let completedOrderCount = 0;
  let salesMetricsError: string | null = null;

  if (supabase) {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('totalAmount, items') // Assuming items is JSONB and contains costPrice & quantity
        .in('status', ['Shipped', 'Delivered']); // Consider only completed orders

      if (ordersError) {
        console.error("[AdminDashboard] Error fetching orders for metrics from Supabase:", ordersError);
        salesMetricsError = `Error fetching sales data: ${ordersError.message}`;
      } else if (ordersData) {
        completedOrderCount = ordersData.length;
        ordersData.forEach(order => {
          totalRevenue += order.totalAmount || 0;
          if (Array.isArray(order.items)) {
            order.items.forEach((item: any) => { // item from jsonb, so 'any'
              totalCOGS += (item.costPrice || 0) * (item.quantity || 0);
            });
          }
        });
      }
    } catch (e: any) {
        console.error("[AdminDashboard] Exception fetching orders for metrics from Supabase:", e);
        salesMetricsError = `Exception fetching sales data: ${e.message}`;
    }
  } else {
    salesMetricsError = "Database client not configured for sales metrics.";
  }

  const grossProfit = totalRevenue - totalCOGS;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const averageOrderValue = completedOrderCount > 0 ? totalRevenue / completedOrderCount : 0;

  const salesMetrics = {
    totalRevenue,
    totalCOGS,
    grossProfit,
    grossProfitMargin,
    averageOrderValue,
    orderCountForMetrics: completedOrderCount,
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Peak Pulse Admin Dashboard</CardTitle>
          <CardDescription>Manage your application data and site content configurations, primarily stored in Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-primary">Store Data Overview (from Supabase)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <DashboardStatCard title="Products" count={productCount} link="/admin/products" icon={ShoppingBag} />
            <DashboardStatCard title="Categories" count={categoryCount} link="/admin/categories" icon={Tags} />
            <DashboardStatCard title="Orders" count={orderCount} link="/admin/orders" icon={ListOrdered} />
            <DashboardStatCard title="Users" count={userCount} link="#" icon={Users} note="User management UI pending" />
            <DashboardStatCard title="Collaboration Categories" count={collabCategoryCount} link="/admin/design-hub/collaboration-categories" icon={Tags} />
            <DashboardStatCard title="Collaboration Galleries" count={galleryCount} link="/admin/design-hub/galleries" icon={ImageIconLucide} />
            <DashboardStatCard title="Print Designs" count={printDesignCount} link="/admin/design-hub/print-designs" icon={Printer} />
          </div>
          
          <h3 className="text-lg font-semibold mt-8 mb-4 text-primary">Content Configurations (from Supabase)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ContentStatusCard title="Homepage Content" status={homepageContentStatus} link="/admin/content/homepage" icon={HomeIcon}/>
            <ContentStatusCard title="Our Story Content" status={ourStoryContentStatus} link="/admin/content/our-story" icon={BookOpenText}/>
            <ContentStatusCard title="Footer Content" status={footerContentStatus} link="/admin/content/footer" icon={ListChecks}/>
            <ContentStatusCard title="General Settings" status={generalSettingsStatus} link="/admin/settings" icon={Settings}/>
            <ContentStatusCard title="Site Pages" status="Okay" link="/admin/content/site-pages" icon={FileText} note="Manage multiple pages"/>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><Landmark className="mr-2 h-6 w-6 text-primary"/>Accounting Overview</CardTitle>
            <CardDescription>Sales and profitability summary for 'Shipped' or 'Delivered' orders. COGS calculated from item costPrice at time of sale.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesMetricsError ? (
              <div className="sm:col-span-2 lg:col-span-3 p-4 text-destructive-foreground bg-destructive rounded-md">
                <AlertTriangle className="inline-block mr-2 h-5 w-5" />{salesMetricsError}
              </div>
            ) : (
              <>
                <AccountingStatCard title="Total Revenue" value={`रू${salesMetrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} description={`${salesMetrics.orderCountForMetrics} Orders`} icon={ListOrdered} variant="green" />
                <AccountingStatCard title="Total COGS" value={`रू${salesMetrics.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} description="from completed orders" icon={ShoppingBag} variant="amber" />
                <AccountingStatCard title="Gross Profit" value={`रू${salesMetrics.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} description={`Margin: ${salesMetrics.grossProfitMargin.toFixed(1)}%`} icon={BarChart3} variant="blue" />
              </>
            )}
             <div className="lg:col-span-3 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/accounting/loans" className="block p-3 border rounded-md hover:bg-primary/5 hover:shadow-sm transition-all">
                    <div className="flex items-center text-sm text-primary "><DollarSign className="mr-2 h-4 w-4" /> Manage Loans ({loanCount}) &rarr;</div>
                </Link>
                <Link href="/admin/accounting/tax-report" className="block p-3 border rounded-md hover:bg-primary/5 hover:shadow-sm transition-all">
                    <div className="flex items-center text-sm text-primary "><FileSpreadsheet className="mr-2 h-4 w-4" /> Sales Data Export &rarr;</div>
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
            This admin panel primarily uses Supabase for Products, Categories, Orders, User Profiles (including roles and wishlists), Loans, and dynamic site content (Homepage, Our Story, Footer, General Settings, Other Static Pages via `site_configurations` table).
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>**Supabase & Firebase Config:** Ensure your <code>.env</code> file has correct Supabase and Firebase credentials. The server must be restarted after <code>.env</code> changes.</li>
            <li>**Security:** Admin section access is role-based (requires 'admin' role in user's Supabase profile). Firestore rules (for Firebase Auth users if separate from Supabase users) and Supabase RLS policies for all tables are critical for production security.</li>
            <li>**Accounting Features:** Sales summary and tax data export are for reference. Full accounting needs specialized systems.</li>
            <li>**File-based content (Obsolete):** Any remaining JSON files in `src/data` for content are likely no longer used; data is fetched from Supabase.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

interface DashboardStatCardProps {
  title: string;
  count: string | number;
  link: string;
  icon: React.ElementType;
  note?: string;
}
const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ title, count, link, icon: Icon, note }) => (
  <Card className="bg-muted/30 hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center text-foreground/80">
        <Icon className="mr-2 h-5 w-5 text-primary"/>{title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-foreground">{count}</p>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : <p className="text-xs text-muted-foreground invisible">placeholder</p> }
      {link !== "#" ? (
         <Link href={link} className="text-primary hover:underline text-xs mt-1 block">Manage &rarr;</Link>
      ) : <div className="h-5 mt-1"></div> }
    </CardContent>
  </Card>
);

interface ContentStatusCardProps {
  title: string;
  status: string | 'Okay' | 'Not Found' | 'Error';
  link: string;
  icon: React.ElementType;
  note?: string;
}
const ContentStatusCard: React.FC<ContentStatusCardProps> = ({ title, status, link, icon: Icon, note }) => (
  <Card className="bg-muted/30 hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
       <CardTitle className="text-lg flex items-center text-foreground/80">
        <Icon className="mr-2 h-5 w-5 text-primary"/>{title}
      </CardTitle>
    </CardHeader>
    <CardContent>
       <p className={`text-xl font-semibold ${status === 'Okay' ? 'text-green-600' : status === 'Not Found' ? 'text-amber-600' : 'text-destructive'}`}>{status}</p>
       {note ? <p className="text-xs text-muted-foreground">{note}</p> : <p className="text-xs text-muted-foreground invisible">placeholder</p> }
      <Link href={link} className="text-primary hover:underline text-xs mt-1 block">Edit &rarr;</Link>
    </CardContent>
  </Card>
);

interface AccountingStatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    variant?: 'green' | 'amber' | 'blue' | 'default';
}
const AccountingStatCard: React.FC<AccountingStatCardProps> = ({ title, value, description, icon: Icon, variant = 'default' }) => {
    const variantClasses = {
        green: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300",
        amber: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
        blue: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
        default: "bg-muted/50 border-border text-foreground"
    };
    const iconColorClasses = {
        green: "text-green-600 dark:text-green-400",
        amber: "text-amber-600 dark:text-amber-400",
        blue: "text-blue-600 dark:text-blue-400",
        default: "text-primary"
    };

    return (
        <Card className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${variantClasses[variant]}`}>
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium ">{title}</p>
                <Icon className={`h-5 w-5 ${iconColorClasses[variant]}`}/>
            </div>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-current/70">{description}</p>
        </Card>
    );
};
