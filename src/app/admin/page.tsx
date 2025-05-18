
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit3, Users, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>Manage your Peak Pulse application from here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a placeholder admin dashboard. In a real application, this area would provide summaries, quick actions, and navigation to various management sections.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary"/>Manage Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Edit homepage sections, product details, and other site content.</p>
            <Link href="/admin/content/homepage" className="text-primary hover:underline text-sm">
              Edit Homepage Content &rarr;
            </Link>
            {/* Add more links: e.g., Manage Products, Manage Collections */}
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>View Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Review and manage customer orders (functionality to be built).</p>
             <p className="text-sm text-accent">Order management (view, update status) would be implemented here.</p>
          </CardContent>
        </Card>
         <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Manage Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">View and manage user accounts (functionality to be built).</p>
             <p className="text-sm text-accent">User management (view, roles, etc.) would be implemented here.</p>
          </CardContent>
        </Card>
         <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Eye className="mr-2 h-5 w-5 text-primary"/>Site Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">View site traffic and performance metrics (functionality to be built).</p>
             <p className="text-sm text-accent">Analytics integration would be displayed here.</p>
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
