
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

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
    // This case should ideally be handled by the AccountLayout redirecting to login
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
    <div className="container-wide section-padding">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to your Dashboard, {user.name?.split(' ')[0] || 'Valued Customer'}!</CardTitle>
          <CardDescription>This is a simplified dashboard page for debugging.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Your account overview will appear here once fully implemented.</p>
          <div className="mt-6 space-x-4">
            <Button asChild variant="outline">
                <Link href="/account/orders">View Orders</Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/account/profile">Edit Profile</Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/account/wishlist">My Wishlist</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
