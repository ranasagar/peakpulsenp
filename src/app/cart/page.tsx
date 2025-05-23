
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Trash2, Plus, Minus, XCircle, ArrowRight, Palette } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';

export default function CartPage() {
  const { cartItems, cartItemCount, subtotal, removeFromCart, updateItemQuantity, isCartLoading } = useCart();
  const { toast } = useToast();

  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 1) {
      updateItemQuantity(itemId, newQuantity);
    }
  };

  if (isCartLoading) {
    return (
      <MainLayout>
        <div className="container-wide section-padding text-center">
          <ShoppingBag className="mx-auto h-12 w-12 animate-pulse text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading your cart...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-wide section-padding">
        <div className="mb-10 text-center">
          <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Your Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">{cartItemCount > 0 ? `${cartItemCount} item(s) in your cart` : "Your cart is currently empty."}</p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="shadow-lg text-center py-16">
            <CardContent>
              <XCircle className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
              <CardTitle className="text-2xl font-semibold text-foreground mb-3">Your Cart is Empty</CardTitle>
              <CardDescription className="text-muted-foreground mb-8 max-w-md mx-auto">
                Looks like you haven't added anything to your cart yet. Start exploring our collections!
              </CardDescription>
              <Button size="lg" asChild>
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" /> Continue Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review the items in your cart.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] hidden sm:table-cell">Image</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-[50px] text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="hidden sm:table-cell">
                              <Image
                                src={item.customization?.predefinedDesign?.imageUrl || item.imageUrl!}
                                alt={item.name}
                                width={64}
                                height={78}
                                className="rounded-md object-cover aspect-[3/4]"
                                data-ai-hint={item.dataAiHint || "product fashion"}
                              />
                            </TableCell>
                            <TableCell>
                              <Link href={`/products/${item.slug || item.productId}`} className="font-medium text-foreground hover:text-primary">{item.name}</Link>
                              {item.customization && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <p className="font-medium text-primary/80 flex items-center"><Palette size={12} className="mr-1"/>Customized:</p>
                                  {item.customization.type === 'predefined' && item.customization.predefinedDesign && (
                                    <p className="pl-2">&bull; Design: {item.customization.predefinedDesign.name}</p>
                                  )}
                                  {item.customization.customDescription && (
                                    <p className="pl-2 truncate w-40">&bull; Idea: {item.customization.customDescription}</p>
                                  )}
                                  {item.customization.instructions && (
                                    <p className="pl-2 truncate w-40">&bull; Notes: {item.customization.instructions}</p>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center border rounded-md w-fit mx-auto">
                                <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity, -1)} className="h-8 w-8 rounded-r-none">
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-3 text-sm font-medium w-10 text-center">{item.quantity}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity, 1)} className="h-8 w-8 rounded-l-none">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">रू{item.price.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-foreground">रू{(item.price * item.quantity).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 sticky top-28">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Cart Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>रू{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold text-foreground">
                    <span>Total</span>
                    <span>रू{subtotal.toLocaleString()}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-4">
                  <Button size="lg" className="w-full text-base" asChild>
                    <Link href="/checkout">
                      Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
