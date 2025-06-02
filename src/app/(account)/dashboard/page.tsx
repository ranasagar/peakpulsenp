
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ShoppingBag, User, Heart, ListOrdered } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Order } from '@/types';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function CustomerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (user && user.id && !authLoading) {
        setIsLoadingOrders(true);
        try {
          const response = await fetch(`/api/account/orders?userId=${user.id}&limit=2`); // Assuming API supports limit
          if (!response.ok) {
            throw new Error('Failed to fetch recent orders.');
          }
          const ordersData: Order[] = await response.json();
          setRecentOrders(ordersData);
        } catch (error) {
          console.error("Dashboard: Failed to fetch recent orders", error);
          toast({ title: "Error", description: "Could not load recent orders.", variant: "destructive" });
        } finally {
          setIsLoadingOrders(false);
        }
      }
    };

    if (!authLoading) {
      fetchRecentOrders();
    }
  }, [user, authLoading, toast]);


  if (authLoading) {
    return (
      <div className="container-wide section-padding text-center flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-lg">Loading your dashboard...</span>
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

  const firstName = user.name?.includes(' ') ? user.name.split(' ')[0] : user.name || 'Customer';

  return (
    <div className="container-wide section-padding space-y-8">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">Welcome back, {firstName}!</CardTitle>
          <CardDescription className="mt-1 text-md">Here's a quick overview of your account.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Orders Card */}
        <Card className="shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Recent Orders</CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/orders">View All Orders</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentOrders.length > 0 ? (
              <ul className="space-y-4">
                {recentOrders.map(order => (
                  <li key={order.id} className="p-4 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">Order ID: <span className="text-primary">{order.id.substring(0,15)}...</span></p>
                        <p className="text-xs text-muted-foreground">
                          Placed: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                       <Badge variant={order.status === 'Delivered' ? 'default' : 'outline'} className={order.status === 'Delivered' ? 'bg-green-100 text-green-700 border-green-300' : ''}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">Total: <span className="font-medium text-foreground">रू{order.totalAmount.toLocaleString()}</span></p>
                         {/* This link would ideally go to a specific order detail page */}
                        <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                            <Link href={`/orders#${order.id}`}>View Details</Link> 
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-6">You haven't placed any orders yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links Card */}
        <div className="space-y-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center">
                <User className="mr-3 h-6 w-6 text-primary" />
                <CardTitle className="text-xl">My Profile</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Keep your personal details and password up to date.</p>
            </CardContent>
            <CardFooter>
                <Button variant="default" className="w-full" asChild>
                <Link href="/profile">Manage Profile</Link>
                </Button>
            </CardFooter>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center">
                <Heart className="mr-3 h-6 w-6 text-pink-500" />
                <CardTitle className="text-xl">My Wishlist</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                You have <span className="font-bold text-primary">{user.wishlist?.length || 0}</span> items in your wishlist.
                </p>
            </CardContent>
             <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                <Link href="/wishlist">View Wishlist</Link>
                </Button>
            </CardFooter>
            </Card>
        </div>
      </div>

      {user.roles?.includes('affiliate') && (
          <Card className="mt-8 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center">
                    <ListOrdered className="mr-3 h-6 w-6 text-green-600" />
                    <CardTitle className="text-xl">Affiliate Portal</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Track your referrals, sales, and earnings.</p>
            </CardContent>
            <CardFooter>
                <Button variant="secondary" className="w-full" asChild>
                    <Link href="/affiliate-portal">Go to Affiliate Portal</Link>
                </Button>
            </CardFooter>
          </Card>
      )}
    </div>
  );
}
