
"use client";

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card'; // Re-use product card for consistency
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';

// Mock Data - Replace with actual data fetching
const mockWishlistItems: Product[] = [
  { 
    id: 'prod-3', name: 'Urban Nomad Pants', slug: 'urban-nomad-pants', price: 7500, 
    images: [{ id: 'img-wish-1', url: 'https://placehold.co/600x800.png', altText: 'Urban Nomad Pants on wishlist' }], 
    categories: [{ id: 'cat-3', name: 'Bottoms', slug: 'bottoms' }], 
    shortDescription: 'Street-ready style with traditional touches.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
  { 
    id: 'prod-4', name: 'Silk Scarf Mandala', slug: 'silk-scarf-mandala', price: 4200, 
    images: [{ id: 'img-wish-2', url: 'https://placehold.co/600x800.png', altText: 'Silk Scarf with Mandala design on wishlist' }], 
    categories: [{ id: 'cat-4', name: 'Accessories', slug: 'accessories' }], 
    shortDescription: 'Hand-painted pure silk elegance.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
  { 
    id: 'prod-6', name: 'Everest Summit Hoodie', slug: 'everest-summit-hoodie', price: 9800, 
    images: [{ id: 'img-wish-3', url: 'https://placehold.co/600x800.png', altText: 'Everest Summit Hoodie on wishlist' }], 
    categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }], 
    shortDescription: 'Warmth and style inspired by the highest peaks.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
];

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setWishlistItems(mockWishlistItems);
      setIsLoading(false);
    }, 500);
  }, []);

  // TODO: Implement remove from wishlist functionality
  const handleRemoveFromWishlist = (productId: string) => {
    console.log("Removing product from wishlist:", productId);
    // setWishlistItems(prev => prev.filter(item => item.id !== productId));
    // toast({ title: "Item removed from wishlist" });
  };

  if (isLoading) {
    return <div className="container-wide section-padding text-center">Loading wishlist...</div>;
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
                    {/* TODO: Add a more prominent remove button if needed, ProductCard might have AddToCart, which could change to Remove here */}
                    {/* Example:
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFromWishlist(product.id)}
                    >
                        Remove
                    </Button> */}
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

    