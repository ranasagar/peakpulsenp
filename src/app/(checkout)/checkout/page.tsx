
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditCard, Lock, ShoppingBag, Truck, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/types';

const shippingSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  streetAddress: z.string().min(5, "Street address is required."),
  apartmentSuite: z.string().optional(),
  city: z.string().min(2, "City is required."),
  country: z.string().min(2, "Country is required."), // Could be a Select component
  postalCode: z.string().min(3, "Postal code is required."),
  phone: z.string().min(7, "Phone number is required.").optional(),
});

const paymentSchema = z.object({
  cardNumber: z.string().length(16, "Card number must be 16 digits.").regex(/^\d+$/, "Card number must be digits."),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be MM/YY."),
  cvc: z.string().length(3, "CVC must be 3 digits.").regex(/^\d+$/, "CVC must be digits."),
  cardholderName: z.string().min(2, "Cardholder name is required."),
});

const checkoutSchema = shippingSchema.merge(paymentSchema).extend({
    promoCode: z.string().optional(),
    saveInfo: z.boolean().default(false).optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Mock cart items - replace with actual cart data
const mockCartItems: CartItem[] = [
  { id: 'prod-1-m', productId: 'prod-1', name: 'Himalayan Breeze Jacket (M)', price: 12000, quantity: 1, imageUrl: 'https://placehold.co/80x80.png?text=Jacket' },
  { id: 'prod-2', productId: 'prod-2', name: 'Kathmandu Comfort Tee', price: 3500, quantity: 2, imageUrl: 'https://placehold.co/80x80.png?text=Tee' },
];
const subtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
const shippingCost = 500; // Mock shipping
const total = subtotal + shippingCost;

export default function CheckoutPage() {
  const { toast } = useToast();
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
        // Pre-fill if user is logged in and has saved address
        saveInfo: true,
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    console.log("Checkout data:", data);
    // Mock API call
    toast({
      title: "Order Placed!",
      description: "Thank you for your purchase. Your order is being processed.",
      action: <Link href="/account/orders"><Button variant="outline" size="sm">View Orders</Button></Link>
    });
    // Redirect to order confirmation page or clear cart
    // router.push('/order-confirmation/ORDER_ID');
  };

  return (
    <div className="container-slim py-12 md:py-20">
      <div className="text-center mb-12">
        <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Complete Your Purchase</h1>
        <p className="text-muted-foreground mt-2">Securely enter your shipping and payment details.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Shipping & Payment Details */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Truck className="mr-3 h-6 w-6 text-primary"/>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} placeholder="John Doe" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="streetAddress" render={({ field }) => (
                  <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} placeholder="123 Main St" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="apartmentSuite" render={({ field }) => (
                  <FormItem><FormLabel>Apartment, suite, etc. (Optional)</FormLabel><FormControl><Input {...field} placeholder="Apt #101" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} placeholder="Kathmandu" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                    <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} placeholder="44600" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} placeholder="Nepal" /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input type="tel" {...field} placeholder="+977 98********" /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><CreditCard className="mr-3 h-6 w-6 text-primary"/>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic card fields example - In real app use Stripe Elements or similar PCI compliant solution */}
                <FormField control={form.control} name="cardholderName" render={({ field }) => (
                  <FormItem><FormLabel>Name on Card</FormLabel><FormControl><Input {...field} placeholder="John M. Doe" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cardNumber" render={({ field }) => (
                  <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input {...field} placeholder="•••• •••• •••• ••••" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input {...field} placeholder="MM/YY" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="cvc" render={({ field }) => (
                    <FormItem><FormLabel>CVC</FormLabel><FormControl><Input {...field} placeholder="123" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <div className="flex items-center space-x-2 mt-2">
                    <FormField control={form.control} name="saveInfo" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-primary" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">Save this information for next time</FormLabel>
                        </div>
                        </FormItem>
                    )} />
                </div>
                 <p className="text-xs text-muted-foreground flex items-center mt-4"><Lock className="h-3 w-3 mr-1.5 text-green-600"/> Your payment information is encrypted and secure.</p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 sticky top-24">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockCartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                       <Image src={item.imageUrl!} alt={item.name} width={40} height={40} className="rounded mr-3" data-ai-hint="product fashion"/>
                       <div>
                           <p className="text-foreground font-medium">{item.name}</p>
                           <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                       </div>
                    </div>
                    <p className="text-foreground">रू{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="text-foreground">रू{subtotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Shipping</p>
                  <p className="text-foreground">रू{shippingCost.toLocaleString()}</p>
                </div>
                <FormField control={form.control} name="promoCode" render={({ field }) => (
                  <FormItem className="pt-2">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="promo" className="border-none">
                            <AccordionTrigger className="text-sm text-primary hover:no-underline p-0 font-medium">
                                <Gift className="h-4 w-4 mr-2"/> Have a promo code?
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                 <div className="flex gap-2">
                                    <FormControl><Input {...field} placeholder="Enter code" className="h-9"/></FormControl>
                                    <Button type="button" variant="outline" size="sm" className="h-9 whitespace-nowrap">Apply</Button>
                                 </div>
                                 <FormMessage className="mt-1 text-xs"/>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </FormItem>
                )} />
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <p className="text-foreground">Total</p>
                  <p className="text-primary">रू{total.toLocaleString()}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full text-base">
                  <Lock className="mr-2 h-5 w-5" /> Place Order
                </Button>
              </CardFooter>
            </Card>
            <p className="text-xs text-muted-foreground text-center mt-4">By placing your order, you agree to Peak Pulse&apos;s <Link href="/terms-of-service" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>.</p>
          </div>
        </form>
      </Form>
    </div>
  );
}
