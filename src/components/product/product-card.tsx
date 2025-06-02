
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Product } from '@/types';
import { ShoppingCart, Heart, Loader2 } from 'lucide-react';
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; 
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user, isAuthenticated, isLoading: authIsLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.wishlist) {
      setIsWishlisted(user.wishlist.includes(product.id));
    } else {
      setIsWishlisted(false);
    }
  }, [user, product.id, isAuthenticated]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if button is inside Link
    addToCart(product, 1); // Assumes no variants for simplicity on card, or default variant
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (!isAuthenticated || !user) {
      toast({ title: "Please Login", description: "You need to be logged in to manage your wishlist.", variant: "default" });
      return;
    }
    setIsWishlistLoading(true);
    const endpoint = isWishlisted ? '/api/account/wishlist/remove' : '/api/account/wishlist/add';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.rawError || `Failed to ${isWishlisted ? 'remove from' : 'add to'} wishlist`);
      }
      await refreshUserProfile(); 

      toast({
        title: !isWishlisted ? "Added to Wishlist" : "Removed from Wishlist", 
        description: `${product.name} has been ${!isWishlisted ? 'added to' : 'removed from'} your wishlist.`,
      });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsWishlistLoading(false);
    }
  };
  

  return (
    <Card className={cn(`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-border/60 flex flex-col h-full`, className)}>
      <Link href={`/products/${product.slug}`} className="block flex-shrink-0">
        <CardContent className="p-0">
          <AspectRatio ratio={3 / 4} className="bg-muted">
            <Image
              src={product.images[0]?.url || 'https://placehold.co/600x800.png'}
              alt={product.images[0]?.altText || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
              data-ai-hint={product.images[0]?.dataAiHint || "fashion clothing product"}
            />
          </AspectRatio>
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-9 w-9 bg-card/70 hover:bg-card text-foreground rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading || authIsLoading}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isWishlistLoading || authIsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> :
            <Heart className={cn("h-5 w-5", isWishlisted ? "fill-pink-500 text-pink-500" : "text-foreground")} />}
          </Button>
        </CardContent>
      </Link>
      <CardFooter className="p-4 bg-card/80 backdrop-blur-sm mt-auto flex-grow flex flex-col justify-between">
        <div className="w-full">
            <Link href={`/products/${product.slug}`} className="hover:text-primary">
                <h3 className="text-md font-semibold text-foreground truncate mb-1">{product.name}</h3>
            </Link>
            <p className="text-sm text-muted-foreground mb-2 overflow-hidden h-10">
              {product.shortDescription}
            </p>
        </div>
        <div className="flex items-center justify-between mt-auto w-full">
            <p className="text-lg font-bold text-primary">
                रू{product.price.toLocaleString()}
                {product.compareAtPrice && (
                    <span className="ml-2 text-sm text-muted-foreground line-through">रू{product.compareAtPrice.toLocaleString()}</span>
                )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              className="hidden md:inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleAddToCart}
              className="inline-flex md:hidden" 
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
