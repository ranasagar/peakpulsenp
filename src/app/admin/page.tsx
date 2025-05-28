
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText, ShoppingBag, BarChart3, ListOrdered, Landmark, Tags, Users, Settings, AlertTriangle, FileText, Home as HomeIcon, ListChecks, DollarSign, FileSpreadsheet, MessageSquare, Palette, ImageIcon as ImageIconLucide, Printer, Package } from 'lucide-react'; // Added Package
import Link from 'next/link';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

async function getSupabaseCount(tableName: string): Promise<string | number> {
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    const message = supabaseAdmin === null ? '[AdminDashboard] Supabase ADMIN client (service_role) not available for counting.' : '[AdminDashboard] Supabase PUBLIC client (fallback) not available for counting.';
    console.warn(`${message} Check .env variables and server restart for table: ${tableName}.`);
    return 'N/A (DB Client Error)';
  }
  
  try {
    const { count, error } = await client.from(tableName).select('*', { count: 'exact', head: true });
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
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    return 'Error (DB Client)';
  }
  try {
    const { data, error } = await client
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
  let productCount: string | number = 'N/A';
  let orderCount: string | number = 'N/A';
  let userCount: string | number = 'N/A';
  let categoryCount: string | number = 'N/A';
  let loanCount: string | number = 'N/A';
  let collabCategoryCount: string | number = 'N/A';
  let galleryCount: string | number = 'N/A';
  let printDesignCount: string | number = 'N/A';
  let reviewCount: string | number = 'N/A';

  let homepageContentStatus: string | 'Okay' | 'Not Found' | 'Error' = 'Error';
  let ourStoryContentStatus: string | 'Okay' | 'Not Found' | 'Error' = 'Error';
  let generalSettingsStatus: string | 'Okay' | 'Not Found' | 'Error' = 'Error';
  let footerContentStatus: string | 'Okay' | 'Not Found' | 'Error' = 'Error';
  
  const client = supabaseAdmin || fallbackSupabase;

  if (client) {
    productCount = await getSupabaseCount('products');
    orderCount = await getSupabaseCount('orders');
    userCount = await getSupabaseCount('users');
    categoryCount = await getSupabaseCount('categories');
    loanCount = await getSupabaseCount('loans');
    collabCategoryCount = await getSupabaseCount('design_collaboration_categories');
    galleryCount = await getSupabaseCount('design_collaborations');
    printDesignCount = await getSupabaseCount('print_on_demand_designs');
    reviewCount = await getSupabaseCount('reviews');
    
    homepageContentStatus = await getSiteConfigurationStatus('homepageContent');
    ourStoryContentStatus = await getSiteConfigurationStatus('ourStoryContent');
    generalSettingsStatus = await getSiteConfigurationStatus('siteGeneralSettings');
    footerContentStatus = await getSiteConfigurationStatus('footerContent');
  } else {
    console.warn("[AdminDashboard] Supabase client not available for fetching counts and statuses.");
    const dbClientErrorMsg = "N/A (DB Client Error)";
    productCount = dbClientErrorMsg;
    orderCount = dbClientErrorMsg;
    userCount = dbClientErrorMsg;
    categoryCount = dbClientErrorMsg;
    loanCount = dbClientErrorMsg;
    collabCategoryCount = dbClientErrorMsg;
    galleryCount = dbClientErrorMsg;
    printDesignCount = dbClientErrorMsg;
    reviewCount = dbClientErrorMsg;
    homepageContentStatus = dbClientErrorMsg;
    ourStoryContentStatus = dbClientErrorMsg;
    generalSettingsStatus = dbClientErrorMsg;
    footerContentStatus = dbClientErrorMsg;
  }


  let totalRevenue = 0;
  let totalCOGS = 0;
  let completedOrderCount = 0;
  let salesMetricsError: string | null = null;


  if (client) {
    try {
      const { data: ordersData, error: ordersError } = await client
        .from('orders')
        .select('totalAmount, items') 
        .in('status', ['Shipped', 'Delivered']); 

      if (ordersError) {
        console.error("[AdminDashboard] Error fetching orders for metrics from Supabase:", ordersError);
        salesMetricsError = `Error fetching sales data: ${ordersError.message}`;
      } else if (ordersData) {
        completedOrderCount = ordersData.length;
        ordersData.forEach(order => {
          totalRevenue += order.totalAmount || 0;
          if (Array.isArray(order.items)) {
            order.items.forEach((item: any) => { 
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
          <CardDescription>Manage your application data and site content. Products, Orders, Users, Loans, and Site Configurations are now managed via Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-primary">Store Data Overview (from Supabase)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <DashboardStatCard title="Products" count={productCount} link="/admin/products" icon={Package} />
            <DashboardStatCard title="Categories" count={categoryCount} link="/admin/categories" icon={Tags} />
            <DashboardStatCard title="Orders" count={orderCount} link="/admin/orders" icon={ListOrdered} />
            <DashboardStatCard title="Users" count={userCount} link="#" icon={Users} note="User management UI pending" />
            <DashboardStatCard title="Reviews" count={reviewCount} link="/admin/reviews" icon={MessageSquare} />
            <DashboardStatCard title="Collab Categories" count={collabCategoryCount} link="/admin/design-hub/collaboration-categories" icon={Tags} />
            <DashboardStatCard title="Collab Galleries" count={galleryCount} link="/admin/design-hub/galleries" icon={ImageIconLucide} />
            <DashboardStatCard title="Print Designs" count={printDesignCount} link="/admin/design-hub/print-designs" icon={Printer} />
          </div>
          
          <h3 className="text-lg font-semibold mt-8 mb-4 text-primary">Content Configurations (from Supabase)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ContentStatusCard title="Homepage Content" status={homepageContentStatus} link="/admin/content/homepage" icon={HomeIcon}/>
            <ContentStatusCard title="Our Story Content" status={ourStoryContentStatus} link="/admin/content/our-story" icon={BookOpenText}/>
            <ContentStatusCard title="Footer Content" status={footerContentStatus} link="/admin/content/footer" icon={ListChecks}/>
            <ContentStatusCard title="General Settings" status={generalSettingsStatus} link="/admin/settings" icon={Settings}/>
            <ContentStatusCard title="Site Pages (Privacy, Terms etc.)" status={"Okay"} link="/admin/content/site-pages" icon={FileText} note="Manage multiple pages via Supabase"/>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><Landmark className="mr-2 h-6 w-6 text-primary"/>Accounting Overview</CardTitle>
            <CardDescription>Sales and profitability summary for 'Shipped' or 'Delivered' orders. COGS based on item costPrice at time of sale.</CardDescription>
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
            This admin panel utilizes Supabase for Products, Categories, Orders, User Profiles (roles, wishlists), Loans, Site Configurations, Design Hub entities, and Product Reviews. Firebase is used for Authentication.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>**Supabase & Firebase Config:** Ensure your <code>.env</code> file has correct Supabase (URL, Anon Key, Service Role Key) and Firebase credentials. The server must be restarted after <code>.env</code> changes.</li>
            <li>**Security:** Admin section access is role-based (requires 'admin' role in user's Supabase profile). Supabase RLS policies are critical for production security. Admin API routes should use the Supabase service_role key where appropriate.</li>
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
