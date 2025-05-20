
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingBag, Heart, User, Edit3, MapPin, CreditCard as CreditCardIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Order, Product } from '@/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      // Fetch Recent Orders
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        try {
          const response = await fetch(`/api/account/orders?userId=${user.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch orders');
          }
          const ordersData: Order[] = await response.json();
          setRecentOrders(ordersData.slice(0, 2)); // Show first 2 recent orders
        } catch (err) {
          console.error("Error fetching recent orders:", err);
          toast({ title: "Error", description: "Could not load recent orders.", variant: "destructive" });
        } finally {
          setIsLoadingOrders(false);
        }
      };

      // Fetch Wishlist Items
      const fetchWishlist = async () => {
        setIsLoadingWishlist(true);
        try {
          const wishlistResponse = await fetch(`/api/account/wishlist?userId=${user.id}`);
          if (!wishlistResponse.ok) {
            const errorData = await wishlistResponse.json();
            throw new Error(errorData.message || 'Failed to fetch wishlist IDs');
          }
          const { wishlist: wishlistProductIds } = await wishlistResponse.json();

          if (wishlistProductIds && wishlistProductIds.length > 0) {
            // Fetch details for products in wishlist
            // This could be optimized with a bulk fetch API endpoint
            const productDetailsPromises = wishlistProductIds.slice(0, 4).map((productId: string) =>
              fetch(`/api/products/${productId}`).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch product ${productId}`)))
            );
            const products = await Promise.all(productDetailsPromises);
            setWishlistItems(products.filter(p => p) as Product[]); // Filter out any nulls from failed fetches
          } else {
            setWishlistItems([]);
          }
        } catch (err) {
          console.error("Error fetching wishlist items:", err);
          toast({ title: "Error", description: "Could not load wishlist items.", variant: "destructive" });
        } finally {
          setIsLoadingWishlist(false);
        }
      };
      fetchOrders();
      fetchWishlist();
    } else if (!authLoading) { // If not loading and no user, clear states
        setIsLoadingOrders(false);
        setIsLoadingWishlist(false);
        setRecentOrders([]);
        setWishlistItems([]);
    }
  }, [user, authLoading, toast]);

  if (authLoading) {
    return <div className="container-wide section-padding text-center flex justify-center items-center min-h-[50vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-4 text-lg">Loading user data...</span></div>;
  }

  if (!user) {
    // This case should ideally be handled by the AccountLayout redirecting to login
    return <div className="container-wide section-padding text-center">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="container-wide section-padding">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {user.name?.split(' ')[0] || 'Valued Customer'}!</h1>
        <p className="text-lg text-muted-foreground">Here’s a quick overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center"><ShoppingBag className="mr-3 h-6 w-6 text-primary" />Recent Orders</CardTitle>
                <CardDescription>A Glimpse of Your Latest Purchases</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/account/orders">View All Orders</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
               recentOrders.length > 0 ? (
                <ul className="space-y-4">
                  {recentOrders.map(order => (
                    <li key={order.id} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                          <p className="font-semibold text-foreground">Order ID: {order.id.substring(0,15)}...</p>
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(order.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                           <p className="font-semibold text-lg text-primary">रू{order.totalAmount?.toLocaleString()}</p>
                           <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                        </div>
                      </div>
                       <div className="mt-3 pt-3 border-t border-border/60">
                        <p className="text-xs text-muted-foreground mb-1">Items:</p>
                        <p className="text-sm text-foreground">{order.items?.[0]?.name}{order.items && order.items.length > 1 ? ` + ${order.items.length -1} more` : ''}</p>
                       </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center"><Heart className="mr-3 h-6 w-6 text-pink-500" />Your Wishlist</CardTitle>
                <CardDescription>Items You Love (Showing up to 4)</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/account/wishlist">View Full Wishlist</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingWishlist ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
               wishlistItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {wishlistItems.map(item => (
                    <Link key={item.id} href={`/products/${item.slug || item.id}`} className="group">
                      <Card className="overflow-hidden transition-all group-hover:shadow-md">
                        <Image 
                          src={item.images?.[0]?.url || 'https://placehold.co/150x150.png'} 
                          alt={item.name || 'Wishlist item'} 
                          width={150} height={150} 
                          className="w-full h-auto object-cover aspect-square"
                          data-ai-hint={item.images?.[0]?.dataAiHint || "product fashion"} />
                        <div className="p-2 text-center">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary">{item.name}</p>
                          <p className="text-xs text-muted-foreground">रू{item.price?.toLocaleString()}</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Your wishlist is empty. Start exploring!</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card className="shadow-lg text-center p-6">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary p-1">
              <AvatarImage src={user.avatarUrl || `https://placehold.co/150x150.png`} alt={user.name || 'User'} data-ai-hint="profile avatar user" />
              <AvatarFallback className="text-3xl">{user.name ? user.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl mb-1">{user.name}</CardTitle>
            <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
            <Button variant="default" size="sm" asChild>
              <Link href="/account/profile"><Edit3 className="mr-2 h-4 w-4" />Edit Profile</Link>
            </Button>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted/50" asChild>
                <Link href="/account/profile"><User className="mr-3 h-5 w-5 text-primary/70"/> Personal Information</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted/50" asChild>
                <Link href="/account/addresses"><MapPin className="mr-3 h-5 w-5 text-primary/70"/> Saved Addresses (UI Only)</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted/50" asChild>
                <Link href="/account/payment-methods"><CreditCardIcon className="mr-3 h-5 w-5 text-primary/70"/> Payment Methods (UI Only)</Link>
              </Button>
            </CardContent>
          </Card>

           {user.roles?.includes('vip') && (
            <Card className="shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
              <CardTitle className="text-xl mb-2">VIP Member</CardTitle>
              <p className="text-sm opacity-90 mb-4">Access exclusive collections and early drops.</p>
              <Button variant="secondary" className="w-full text-primary" asChild>
                <Link href="/vip-collection">Explore VIP Collection</Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

  