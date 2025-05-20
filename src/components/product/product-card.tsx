
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Product } from '@/types';
import { ShoppingCart, Heart, Loader2 } from 'lucide-react';
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
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
    e.preventDefault();
    addToCart(product, 1);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
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
        throw new Error(errorData.message || `Failed to ${isWishlisted ? 'remove from' : 'add to'} wishlist`);
      }
      const { wishlist: updatedWishlist } = await response.json();
      // Update user context or re-fetch user to update wishlist state globally
      // For now, just update local state and toast
      setIsWishlisted(!isWishlisted);
      // Update user context (this is a simplified example, ideally useAuth would have a method to update user.wishlist)
      if (user.wishlist) {
        user.wishlist = updatedWishlist;
      }

      toast({
        title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
        description: `${product.name} has been ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`,
      });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <Card className={cn(`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-border/60 flex flex-col`, className)}>
      <Link href={`/products/${product.slug}`} className="block">
        <CardContent className="p-0">
          <AspectRatio ratio={3 / 4} className="bg-muted">
            <Image
              src={product.images[0]?.url || 'https://placehold.co/600x800.png'}
              alt={product.images[0]?.altText || product.name}
              layout="fill"
              objectFit="cover"
              className="group-hover:scale-105 transition-transform duration-500 ease-in-out"
              data-ai-hint={product.images[0]?.dataAiHint || "fashion clothing product"}
            />
          </AspectRatio>
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-9 w-9 bg-card/70 hover:bg-card text-foreground rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isWishlistLoading ? <Loader2 className="h-5 w-5 animate-spin" /> :
            <Heart className={cn("h-5 w-5", isWishlisted ? "fill-pink-500 text-pink-500" : "text-foreground")} />}
          </Button>
        </CardContent>
      </Link>
      <CardFooter className="p-4 bg-card/80 backdrop-blur-sm mt-auto"> {/* Added mt-auto to push footer down */}
        <div className="flex-grow flex flex-col justify-between">
            <div>
                <Link href={`/products/${product.slug}`} className="hover:text-primary">
                    <h3 className="text-md font-semibold text-foreground truncate mb-1">{product.name}</h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden">{product.shortDescription}</p>
            </div>
            <div className="flex items-center justify-between mt-auto">
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
                  className="inline-flex md:hidden md:group-hover:opacity-0"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}

  