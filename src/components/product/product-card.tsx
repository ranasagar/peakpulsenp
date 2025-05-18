
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Product } from '@/types';
import { ShoppingCart, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from "@/components/ui/aspect-ratio"


interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if card is wrapped in Link
    // TODO: Implement actual cart logic
    console.log(`Added to cart: ${product.name}`);
    toast({
      title: "Added to Cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement actual wishlist logic
    console.log(`Toggled wishlist for: ${product.name}`);
    toast({
      title: "Wishlist Updated",
      // description: `${product.name} added/removed from wishlist.`, // Needs state to determine action
    });
  };

  return (
    <Card className={`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-border/60 ${className}`}>
      <Link href={`/products/${product.slug}`} className="block">
        <CardContent className="p-0">
          <AspectRatio ratio={3 / 4} className="bg-muted">
            <Image
              src={product.images[0]?.url || 'https://placehold.co/600x800.png'}
              alt={product.images[0]?.altText || product.name}
              layout="fill"
              objectFit="cover"
              className="group-hover:scale-105 transition-transform duration-500 ease-in-out"
              data-ai-hint="fashion clothing product"
            />
          </AspectRatio>
           {/* Wishlist button positioned top-right */}
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-9 w-9 bg-card/70 hover:bg-card text-foreground rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={handleToggleWishlist}
            aria-label="Add to wishlist"
          >
            <Heart className="h-5 w-5" />
          </Button>
        </CardContent>
      </Link>
      <CardFooter className="p-4 bg-card/80 backdrop-blur-sm">
        <div className="flex-grow">
          <Link href={`/products/${product.slug}`} className="hover:text-primary">
            <h3 className="text-md font-semibold text-foreground truncate mb-1">{product.name}</h3>
          </Link>
          <p className="text-sm text-muted-foreground mb-2 truncate">{product.shortDescription}</p>
          <div className="flex items-center justify-between">
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
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              onClick={handleAddToCart}
              className="opacity-100 group-hover:opacity-0 transition-opacity duration-300 md:hidden" /* Show on mobile, hide on hover for desktop */
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

    