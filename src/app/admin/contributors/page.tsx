
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AdminContributorsPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Users className="mr-3 h-6 w-6 text-primary" />
          Manage Contributors
        </CardTitle>
        <CardDescription>
          This section is under development. Soon you'll be able to manage community contributors, designers, or other collaborators here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground mb-2">Coming Soon!</p>
          <p className="text-muted-foreground">
            The contributors management feature is currently being built.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
