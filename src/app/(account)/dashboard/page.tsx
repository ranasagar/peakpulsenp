
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag, Heart, Edit3, Briefcase } from 'lucide-react'; // Removed User icon as it's not used
import Link from 'next/link';
import type { Order, Product } from '@/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function CustomerDashboardPage() {
  const { user, isLoading: authLoading, refreshUserProfile } = useAuth(); // refreshUserProfile might be useful for refetching if needed
  const { toast } = useToast();

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  
  const [wishlistPreview, setWishlistPreview] = useState<Product[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user && user.id) {
        // Fetch Recent Orders
        setIsLoadingOrders(true);
        try {
          const ordersResponse = await fetch(`/api/account/orders?userId=${user.id}`); 
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setRecentOrders(ordersData.slice(0, 2)); 
          } else {
             const errorData = await ordersResponse.json().catch(() => ({ message: "Could not load recent orders."}));
            toast({ title: "Error", description: errorData.message || "Could not load recent orders.", variant: "destructive" });
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect to orders service.", variant: "destructive" });
        }
        setIsLoadingOrders(false);

        // Fetch Wishlist Preview
        setIsLoadingWishlist(true);
        if (user.wishlist && user.wishlist.length > 0) {
          try {
            // Fetch product details for each ID in the wishlist (limit to 4 for preview)
            const productDetailPromises = user.wishlist.slice(0, 4).map(productId =>
              fetch(`/api/products/${productId}`).then(res => {
                if (res.ok) return res.json();
                console.warn(`Failed to fetch product ${productId} for wishlist preview.`);
                return null;
              })
            );
            const products = (await Promise.all(productDetailPromises)).filter(p => p !== null) as Product[];
            setWishlistPreview(products);
          } catch (error) {
            toast({ title: "Error", description: "Could not load wishlist preview.", variant: "destructive" });
            setWishlistPreview([]);
          }
        } else {
          setWishlistPreview([]); 
        }
        setIsLoadingWishlist(false);
      }
    };

    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [user, authLoading, toast]); // Removed refreshUserProfile from deps unless explicitly needed to trigger refetch

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="container-wide section-padding text-center flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-lg">Loading user data...</span>
      </div>
    );
  }

  if (!user) { // This case should be handled by AccountLayout now, but kept as a fallback
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
                <CardTitle className="text-3xl md:text-4xl">Welcome, {user.name?.split(' ')[0] || 'Valued Customer'}!</CardTitle>
                <CardDescription className="mt-1">Here's a quick overview of your account.</CardDescription>
            </div>
            <Image 
              src={user.avatarUrl || `https://placehold.co/80x80.png`} 
              alt={user.name || "User Avatar"} 
              width={80} 
              height={80} 
              className="rounded-full border-2 border-primary hidden sm:block"
              data-ai-hint="user avatar profile"
            />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            <Button variant="outline" asChild className="justify-start text-md py-6">
                <Link href="/account/orders"><ShoppingBag className="mr-3 h-5 w-5"/>View All Orders</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start text-md py-6">
                <Link href="/account/profile"><Edit3 className="mr-3 h-5 w-5"/>Edit Profile</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start text-md py-6">
                <Link href="/account/wishlist"><Heart className="mr-3 h-5 w-5"/>My Wishlist</Link>
            </Button>
             {user.roles?.includes('affiliate') && (
                 <Button variant="outline" asChild className="justify-start text-md py-6 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20">
                    <Link href="/account/affiliate-portal"><Briefcase className="mr-3 h-5 w-5"/>Affiliate Portal</Link>
                </Button>
            )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><ShoppingBag className="mr-3 h-6 w-6 text-primary"/>Recent Orders</CardTitle>
          <CardDescription>Your last couple of purchases.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map(order => (
                <Card key={order.id} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-3 hover:shadow-md transition-shadow bg-muted/30">
                  <div>
                    <p className="font-semibold text-foreground">Order ID: <span className="text-primary">{order.id.substring(0, 15)}...</span></p>
                    <p className="text-sm text-muted-foreground">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Total: रू{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end sm:items-start">
                    <Badge 
                        variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' || order.status === 'Refunded' ? 'destructive' : 'secondary'}
                        className={order.status === 'Delivered' ? 'bg-green-100 text-green-700' : ''}
                    >
                        {order.status}
                    </Badge>
                     <Button variant="link" size="sm" asChild className="mt-1 p-0 h-auto">
                        <Link href={`/account/orders#${order.id}`}>View Details</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No recent orders found.</p>
          )}
        </CardContent>
      </Card>

      {/* Wishlist Preview */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Heart className="mr-3 h-6 w-6 text-pink-500"/>Wishlist Sneak Peek</CardTitle>
          <CardDescription>A few items you've saved.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWishlist ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : wishlistPreview.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {wishlistPreview.map(product => (
                <Link key={product.id} href={`/products/${product.slug}`} className="block group">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                    <Image
                      src={product.images[0]?.url || `https://placehold.co/200x250.png`}
                      alt={product.name}
                      width={200}
                      height={250}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                      data-ai-hint={product.images[0]?.dataAiHint || "product fashion"}
                    />
                    <div className="p-3 flex-grow flex flex-col justify-between">
                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">रू{product.price.toLocaleString()}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">Your wishlist is empty. Start adding your favorites!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
