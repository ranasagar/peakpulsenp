
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import Link from 'next/link';
import { Heart, ShoppingBag, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function WishlistPage() {
  const { user, isLoading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlistProducts = useCallback(async () => {
    if (!user || !user.id) {
      setIsLoading(false);
      setWishlistItems([]);
      if (!authLoading) toast({ title: "Login Required", description: "Please log in to view your wishlist.", variant: "default" });
      return;
    }
    setIsLoading(true);
    try {
      // Fetch wishlist product IDs from user object (now sourced from Supabase via useAuth)
      const wishlistProductIds = user.wishlist || [];

      if (wishlistProductIds.length > 0) {
        // Fetch product details for each ID in the wishlist
        const productDetailsPromises = wishlistProductIds.map(async (productId: string) => {
          try {
            const res = await fetch(`/api/products/${productId}`); // Assuming product ID can be used as slug
            if (res.ok) return res.json();
            if (res.status === 404) {
              console.warn(`[Wishlist] Product ID '${productId}' not found.`);
              toast({ title: "Item Not Found", description: `A product (ID: ${productId}) in your wishlist is no longer available and has been removed.`, variant: "default" });
              // Optionally, automatically remove this missing product ID from the user's wishlist
              // This would require calling the remove API here. For now, we'll just not display it.
              return null;
            }
            const errorData = await res.json().catch(() => ({}));
            console.warn(`[Wishlist] Failed to fetch product ${productId}: ${errorData.message || res.statusText}`);
            return null;
          } catch (err) {
            console.error(`[Wishlist] Network error fetching product ${productId}:`, err);
            return null;
          }
        });
        const products = (await Promise.all(productDetailsPromises)).filter(p => p !== null) as Product[];
        setWishlistItems(products);
      } else {
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("[WishlistPage] Error fetching wishlist products:", error);
      toast({ title: "Error Loading Wishlist", description: "Could not load your wishlist items.", variant: "destructive" });
      setWishlistItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchWishlistProducts();
    } else if (!authLoading && !user) {
      setIsLoading(false);
      setWishlistItems([]);
    }
  }, [authLoading, user, fetchWishlistProducts]);


  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user || !user.id) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/account/wishlist/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: "Failed to remove item"}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to remove item from wishlist');
      }
      toast({ title: "Item Removed", description: "The item has been removed from your wishlist." });
      await refreshUserProfile(); // This re-fetches user data including the updated wishlist
      // The useEffect watching `user` will then trigger `fetchWishlistProducts`
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (isLoading || authLoading) {
    return (
        <div className="container-wide section-padding flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading your wishlist...</p>
        </div>
    );
  }

  return (
    <div className="container-wide section-padding">
      <Card className="shadow-xl">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-3xl flex items-center text-foreground">
                        <Heart className="mr-3 h-8 w-8 text-pink-500" />
                        Your Wishlist
                    </CardTitle>
                    <CardDescription className="mt-1">Items you&apos;ve saved for later. Don&apos;t let them get away!</CardDescription>
                </div>
                 <Button variant="outline" asChild>
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {wishlistItems.map((product) => (
                <div key={product.id} className="relative group">
                    <ProductCard product={product} />
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-3 right-14 z-10 h-9 w-9 bg-card/70 hover:bg-destructive text-foreground hover:text-destructive-foreground rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={() => handleRemoveFromWishlist(product.id)}
                        aria-label="Remove from wishlist"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Heart className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
              <p className="text-2xl font-semibold text-foreground mb-3">Your Wishlist is Empty</p>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added anything to your wishlist yet. 
                Start exploring our collections and save your favorite items!
              </p>
              <Button size="lg" asChild>
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" /> Discover Products
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
