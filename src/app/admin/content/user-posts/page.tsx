
// This file is no longer in use as the "User Posts" feature has been removed.
// It is kept with a minimal component to prevent build errors if routing still attempts to access it.
// You can safely delete this file from your project if all references and routing are fully removed.
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function AdminUserPostsPageRemoved() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <XCircle className="mr-3 h-6 w-6 text-destructive" />
          Feature Removed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">The &quot;User Style Posts&quot; management feature has been removed from the admin panel.</p>
        <p className="text-sm text-muted-foreground mt-2">This page file (<code>src/app/admin/content/user-posts/page.tsx</code>) can be safely deleted from your project if all links and routing to it have been successfully removed.</p>
      </CardContent>
    </Card>
  );
}
