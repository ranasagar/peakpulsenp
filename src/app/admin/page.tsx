
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit3, Users, ShoppingBag, FileText, AlertTriangle, ListOrdered, BookOpenText, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

async function getSupabaseCount(tableName: string): Promise<number | string> {
  if (!supabase) {
    console.error(`[AdminDashboard] Supabase client not available for counting ${tableName}.`);
    return 'Error';
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

export default async function AdminDashboardPage() {
  const productCount = await getSupabaseCount('products');
  const orderCount = await getSupabaseCount('orders');
  const userCount = await getSupabaseCount('users');
  const homepageContentStatus = await getContentFileStatus('homepage-content.json');
  const ourStoryContentStatus = await getContentFileStatus('our-story-content.json');

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>Manage your Peak Pulse application from here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{productCount}</p>
                <p className="text-xs text-muted-foreground">Total products in Supabase</p>
                 <Link href="/admin/products" className="text-primary hover:underline text-xs mt-1 block">
                    Manage Products &rarr;
                </Link>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-primary"/>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{orderCount}</p>
                <p className="text-xs text-muted-foreground">Total orders in Supabase</p>
                <Link href="/admin/orders" className="text-primary hover:underline text-xs mt-1 block">
                    View Orders &rarr;
                </Link>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userCount}</p>
                <p className="text-xs text-muted-foreground">Total users in Supabase</p>
                {/* <Link href="/admin/users" className="text-primary hover:underline text-xs mt-1 block">
                    Manage Users &rarr; (Not Implemented)
                </Link> */}
                 <p className="text-xs text-accent mt-1">User management UI not yet built.</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Homepage Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-semibold ${homepageContentStatus === 'Managed' ? 'text-green-600' : 'text-amber-600'}`}>{homepageContentStatus}</p>
                 <Link href="/admin/content/homepage" className="text-primary hover:underline text-xs mt-1 block">
                    Edit Homepage &rarr;
                </Link>
              </CardContent>
            </Card>
             <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><BookOpenText className="mr-2 h-5 w-5 text-primary"/>Our Story Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-semibold ${ourStoryContentStatus === 'Managed' ? 'text-green-600' : 'text-amber-600'}`}>{ourStoryContentStatus}</p>
                 <Link href="/admin/content/our-story" className="text-primary hover:underline text-xs mt-1 block">
                    Edit Our Story &rarr;
                </Link>
              </CardContent>
            </Card>
             <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Site Analytics (AI)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-blue-600">Demo Feature</p>
                 <Link href="/admin/analytics" className="text-primary hover:underline text-xs mt-1 block">
                    View AI Analytics &rarr;
                </Link>
              </CardContent>
            </Card>
          </div>
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
            <li>**Authentication & Authorization:** This section currently lacks robust security. In a real app, access must be strictly controlled.</li>
            <li>**Data Management:**
                <ul>
                    <li>Product, Order, and User data are now managed via **Supabase**.</li>
                    <li>Homepage and "Our Story" page content are still managed via **JSON files**. This JSON file-writing approach will **not work in most production/serverless hosting environments** (like Vercel) due to read-only filesystems. A proper database or Headless CMS is recommended for all content management in production.</li>
                </ul>
            </li>
            <li>**User Management UI:** A dedicated UI for managing users (roles, details) is not yet built.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
