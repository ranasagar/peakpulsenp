
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
import MainLayout from '@/components/layout/main-layout';

export default function WishlistPage() {
  const { user, isLoading: authIsLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true); // Combined loading state

  // Fetch all products once on component mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      console.log("[WishlistPage] Fetching all products...");
      setIsLoadingPageData(true);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch all products for wishlist.');
        }
        const productsData: Product[] = await response.json();
        setAllProducts(productsData);
        console.log("[WishlistPage] All products fetched:", productsData.length);
      } catch (error) {
        console.error("[WishlistPage] Error fetching all products:", error);
        toast({ title: "Error Loading Products", description: (error as Error).message, variant: "destructive" });
        setAllProducts([]);
      } finally {
        // setIsLoadingPageData(false) will be handled by the filtering useEffect completion
      }
    };
    fetchAllProducts();
  }, [toast]);

  // Effect to filter wishlist items when user's wishlist or allProducts change
  useEffect(() => {
    console.log("[WishlistPage] Filtering effect triggered. Auth loading:", authIsLoading, "All products loaded:", allProducts.length > 0);
    
    if (authIsLoading || allProducts.length === 0) {
      // Don't filter until auth state is resolved AND all products are loaded
      // but ensure isLoadingPageData reflects the combined state
      if (authIsLoading || (allProducts.length === 0 && isLoadingPageData)) {
          // If still loading all products or auth, keep global loading true
      } else {
          // Auth is done, allProducts is empty (either fetch failed or no products), so stop global loading
          setIsLoadingPageData(false);
      }
      // Reset wishlist items if user logs out or essential data is missing
      if (!authIsLoading && !user) setWishlistItems([]);
      return;
    }

    if (!user || !user.id) {
      console.log("[WishlistPage] No user or user ID. Clearing wishlist items.");
      setWishlistItems([]);
      setIsLoadingPageData(false);
      // Optionally, show a toast if user was expected but not found (e.g., session expired mid-way)
      // if(!authIsLoading && !user) toast({ title: "Login Required", description: "Please log in to view your wishlist.", variant: "default" });
      return;
    }
    
    const wishlistProductIds = user.wishlist || [];
    console.log("[WishlistPage] User wishlist IDs:", wishlistProductIds);
    console.log("[WishlistPage] All products available for filtering:", allProducts.length);

    if (wishlistProductIds.length > 0 && allProducts.length > 0) {
      const filteredItems = allProducts.filter(product => wishlistProductIds.includes(product.id));
      setWishlistItems(filteredItems);
      console.log("[WishlistPage] Filtered wishlist items:", filteredItems.length, filteredItems.map(i => i.name));

      const missingIds = wishlistProductIds.filter(id => !allProducts.some(p => p.id === id));
      if (missingIds.length > 0) {
        console.warn(`[WishlistPage] ${missingIds.length} items from wishlist not found in product catalog:`, missingIds.join(', '));
      }
    } else {
      console.log("[WishlistPage] No wishlist IDs or no products to filter from. Setting wishlist items to empty.");
      setWishlistItems([]);
    }
    setIsLoadingPageData(false); // Filtering is complete
  }, [user, user?.wishlist, allProducts, authIsLoading, toast]); // Added user?.wishlist for more direct reactivity


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
                                  // The useEffect above watching `user?.wishlist` will then re-filter
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (isLoadingPageData) { // Use the combined loading state
    return (
        <MainLayout>
            <div className="container-wide section-padding flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Loading your wishlist...</p>
            </div>
        </MainLayout>
    );
  }
  
  // If user is not authenticated (and auth is not loading anymore), prompt to login
  if (!authIsLoading && !user) {
    return (
      <MainLayout>
        <div className="container-wide section-padding text-center">
          <Card className="max-w-md mx-auto p-8 shadow-xl">
            <Heart className="mx-auto h-16 w-16 text-primary mb-6" />
            <CardTitle className="text-2xl mb-3">View Your Wishlist</CardTitle>
            <CardDescription className="mb-6">
              Log in to see the items you've saved.
            </CardDescription>
            <Button asChild size="lg">
              <Link href="/login?redirect=/wishlist">Login to View Wishlist</Link>
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
    </MainLayout>
  );
}
