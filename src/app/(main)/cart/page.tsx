
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingCart, ShoppingBag, XCircle } from 'lucide-react';
import type { CartItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Mock cart items - replace with actual cart state management (e.g., Context, Zustand, Redux)
const initialMockCartItems: CartItem[] = [
  { id: 'prod-1-m', productId: 'prod-1', variantId: 'var-m-blue', name: 'Himalayan Breeze Jacket (M)', price: 12000, quantity: 1, imageUrl: 'https://placehold.co/100x120.png?text=Jacket' },
  { id: 'prod-2', productId: 'prod-2', name: 'Kathmandu Comfort Tee', price: 3500, quantity: 2, imageUrl: 'https://placehold.co/100x120.png?text=Tee' },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialMockCartItems);
  const { toast } = useToast();

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Or remove item if quantity is 0
    setCartItems(items => 
      items.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: "The item has been removed from your cart.",
    });
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = cartItems.length > 0 ? 500 : 0; // Example shipping cost
  const total = subtotal + shippingCost;

  return (
    <div className="container-wide section-padding">
      <div className="text-center mb-12">
        <ShoppingCart className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Your Shopping Cart</h1>
        {cartItems.length > 0 && <p className="text-lg text-muted-foreground mt-2">Review your items and proceed to checkout.</p>}
      </div>

      {cartItems.length === 0 ? (
        <Card className="shadow-xl py-16 text-center">
          <CardContent>
            <ShoppingBag className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold text-foreground mb-3">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Looks like you haven&apos;t added anything to your cart yet. 
              Explore our collections and find something you love!
            </p>
            <Button size="lg" asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map(item => (
              <Card key={item.id} className="shadow-lg overflow-hidden">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="w-full sm:w-24 h-32 sm:h-auto flex-shrink-0 bg-muted rounded-md overflow-hidden">
                    <Image 
                        src={item.imageUrl || 'https://placehold.co/100x120.png'} 
                        alt={item.name} 
                        width={100} height={120} 
                        className="w-full h-full object-cover"
                        data-ai-hint="product fashion"
                    />
                  </div>
                  <div className="flex-grow">
                    <Link href={`/products/${item.productId}`} className="hover:text-primary">
                        <h3 className="text-lg font-semibold text-foreground mb-1">{item.name}</h3>
                    </Link>
                    {/* Add variant details if any, e.g., Size: M, Color: Blue */}
                    <p className="text-sm text-muted-foreground mb-2">Price: रू{item.price.toLocaleString()}</p>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Decrease quantity">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="h-8 w-12 text-center px-1"
                        aria-label="Item quantity"
                      />
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between sm:ml-auto">
                    <p className="text-lg font-semibold text-foreground">रू{(item.price * item.quantity).toLocaleString()}</p>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)} aria-label="Remove item">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 sticky top-24">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-md">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="text-foreground font-medium">रू{subtotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-md">
                  <p className="text-muted-foreground">Estimated Shipping</p>
                  <p className="text-foreground font-medium">रू{shippingCost.toLocaleString()}</p>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <p className="text-foreground">Total</p>
                  <p className="text-primary">रू{total.toLocaleString()}</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button size="lg" className="w-full text-base" asChild>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </CardFooter>
            </Card>
             <p className="text-xs text-muted-foreground text-center mt-4">Shipping and taxes calculated at checkout.</p>
          </div>
        </div>
      )}
    </div>
  );
}
