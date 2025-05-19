
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Product } from '@/types';
import { ShoppingCart, Heart } from 'lucide-react';
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useCart } from '@/context/cart-context';
// Import clsx and twMerge directly
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { cn } from '@/lib/utils'; // Keep using cn from lib/utils

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`Toggled wishlist for: ${product.name}`);
  };

  return (
    <Card className={cn(`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-border/60`, className)}>
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
            aria-label="Add to wishlist"
          >
            <Heart className="h-5 w-5" />
          </Button>
        </CardContent>
      </Link>
      <CardFooter className="p-4 bg-card/80 backdrop-blur-sm">
        <div className="flex-grow flex flex-col justify-between h-full">
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
                {/* Text button - visible on hover on md screens and up */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddToCart}
                  className="hidden md:inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
                {/* Icon button - visible on screens smaller than md, hidden on hover if text button appears */}
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleAddToCart}
                  className="inline-flex md:hidden group-hover:opacity-0 md:group-hover:opacity-100" // Icon remains on md+ if text button is NOT hovered
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
