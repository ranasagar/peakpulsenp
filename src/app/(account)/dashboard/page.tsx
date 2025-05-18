
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingBag, Heart, User, Edit3, MapPin, CreditCard as CreditCardIcon } from 'lucide-react'; // Renamed CreditCard to avoid conflict
import Link from 'next/link';
import Image from 'next/image';
import type { Order, Product } from '@/types';

// Mock Data - Replace with actual data fetching
const mockRecentOrders: Partial<Order>[] = [
  { id: 'ORD-001', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), totalAmount: 12000, status: 'Shipped', items: [{ name: 'Himalayan Breeze Jacket', quantity: 1, price: 12000, productId: 'prod-1' }] },
  { id: 'ORD-002', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), totalAmount: 3500, status: 'Delivered', items: [{ name: 'Kathmandu Comfort Tee', quantity: 1, price: 3500, productId: 'prod-2' }] },
];

const mockWishlistItems: Partial<Product>[] = [
  { id: 'prod-3', name: 'Urban Nomad Pants', price: 7500, images: [{ id: 'img-wish-1', url: 'https://placehold.co/100x100.png', dataAiHint: 'urban pants' }] },
  { id: 'prod-4', name: 'Silk Scarf Mandala', price: 4200, images: [{ id: 'img-wish-2', url: 'https://placehold.co/100x100.png', dataAiHint: 'mandala scarf' }] },
];

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="container-wide section-padding text-center">Loading user data...</div>; // Or a more styled loader
  }

  return (
    <div className="container-wide section-padding">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {user.name?.split(' ')[0] || 'Valued Customer'}!</h1>
        <p className="text-lg text-muted-foreground">Here’s a quick overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Orders */}
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
              {mockRecentOrders.length > 0 ? (
                <ul className="space-y-4">
                  {mockRecentOrders.map(order => (
                    <li key={order.id} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                          <p className="font-semibold text-foreground">Order ID: {order.id}</p>
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

          {/* Wishlist Summary */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center"><Heart className="mr-3 h-6 w-6 text-pink-500" />Your Wishlist</CardTitle>
                <CardDescription>Items You Love</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/account/wishlist">View Full Wishlist</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {mockWishlistItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mockWishlistItems.slice(0,4).map(item => ( // Show first 4
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

        {/* Sidebar / Profile Quick View */}
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
                <Link href="/account/addresses"><MapPin className="mr-3 h-5 w-5 text-primary/70"/> Saved Addresses</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted/50" asChild>
                <Link href="/account/payment-methods"><CreditCardIcon className="mr-3 h-5 w-5 text-primary/70"/> Payment Methods</Link>
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
