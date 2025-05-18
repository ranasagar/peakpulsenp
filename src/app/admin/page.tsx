
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit3, Users, ShoppingBag, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types';

async function getProductCount(): Promise<number> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const products: Product[] = JSON.parse(jsonData);
    return products.length;
  } catch (error) {
    console.error("Error reading products.json for count:", error);
    return 0;
  }
}

async function getContentFileStatus(fileName: string): Promise<'Managed' | 'Not Found' | 'Error'> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', fileName);
    await fs.access(filePath); // Check if file exists
    // Could add more sophisticated checks here, e.g., try to parse JSON
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
  const productCount = await getProductCount();
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
                <p className="text-xs text-muted-foreground">Total products managed</p>
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
                <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Our Story Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-semibold ${ourStoryContentStatus === 'Managed' ? 'text-green-600' : 'text-amber-600'}`}>{ourStoryContentStatus}</p>
                 <Link href="/admin/content/our-story" className="text-primary hover:underline text-xs mt-1 block">
                    Edit Our Story &rarr;
                </Link>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary"/>Manage Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Add, edit, and update product information, pricing, and stock.</p>
            <Link href="/admin/products" className="text-primary hover:underline text-sm">
              Go to Product Management &rarr;
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Eye className="mr-2 h-5 w-5 text-primary"/>View Orders (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Review and manage customer orders.</p>
             <p className="text-sm text-accent">Order management (view, update status) would be implemented here with a database backend.</p>
          </CardContent>
        </Card>
         <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Manage Users (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">View and manage user accounts.</p>
             <p className="text-sm text-accent">User management (view, roles, etc.) would be implemented here with a database backend.</p>
          </CardContent>
        </Card>
         <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Site Analytics (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">View site traffic and performance metrics.</p>
             <p className="text-sm text-accent">Analytics integration (e.g., Google Analytics) would be displayed here.</p>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-destructive">Important Note on this Admin Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            This admin section is a highly simplified demonstration.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>It lacks authentication and authorization. In a real app, this entire section must be secured.</li>
            <li>Content editing (e.g., homepage content) writes directly to a JSON file in the project. This method is not scalable and will not work in most production/serverless hosting environments like Vercel.</li>
            <li>A proper CMS (Content Management System) or a database backend is recommended for robust content management.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
