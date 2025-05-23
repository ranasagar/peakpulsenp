
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react'; // Keep for potential future use
import { useAuth } from '@/hooks/use-auth'; // Keep for potential future use

export default function CustomerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="container-wide section-padding text-center flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-lg">Loading user data...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-wide section-padding text-center">
        <p>Please log in to view your dashboard.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-wide section-padding space-y-10">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl">Welcome to your Dashboard, {user.name?.split(' ')[0] || 'Customer'}!</CardTitle>
          <CardDescription className="mt-1">This is a simplified dashboard page to test routing.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your account features (Orders, Profile, Wishlist) can be accessed via the user menu.</p>
          <p className="mt-4">If you see this, the route to /account/dashboard is working!</p>
        </CardContent>
      </Card>
    </div>
  );
}
