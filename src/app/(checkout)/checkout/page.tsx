
"use client";

import { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Lock, ShoppingBag, Truck, Gift, Globe, Info, Loader2, Banknote, QrCode, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/types';
import { calculateInternationalShipping } from '@/ai/flows/calculate-international-shipping-flow';
import type { CalculateInternationalShippingOutput } from '@/ai/flows/calculate-international-shipping-flow';
import { useRouter } from 'next/navigation';

const shippingSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  streetAddress: z.string().min(5, "Street address is required."),
  apartmentSuite: z.string().optional(),
  city: z.string().min(2, "City is required."),
  country: z.string().min(2, "Country is required."),
  postalCode: z.string().min(3, "Postal code is required."),
  phone: z.string().min(7, "Phone number is required.").optional(),
  isInternational: z.boolean().default(false).optional(),
  internationalDestinationCountry: z.string().optional(),
});

const paymentCardSchema = z.object({
  cardNumber: z.string().length(16, "Card number must be 16 digits.").regex(/^\d+$/, "Card number must be digits."),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be MM/YY."),
  cvc: z.string().length(3, "CVC must be 3 digits.").regex(/^\d+$/, "CVC must be digits."),
  cardholderName: z.string().min(2, "Cardholder name is required."),
});

const checkoutSchema = shippingSchema.extend({
    promoCode: z.string().optional(),
    saveInfo: z.boolean().default(false).optional(),
    paymentMethod: z.string().min(1, "Please select a payment method."),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'card_international' && data.isInternational) { 
      const cardValidation = paymentCardSchema.safeParse(data);
      if (!cardValidation.success) {
        cardValidation.error.errors.forEach((err) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: err.message,
            path: err.path,
          });
        });
      }
    }
    if (data.isInternational && !data.internationalDestinationCountry) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Destination country is required for international shipping.",
            path: ["internationalDestinationCountry"],
        });
    }
});


type CheckoutFormValues = z.infer<typeof checkoutSchema> & Partial<z.infer<typeof paymentCardSchema>>;

// Mock cart items - replace with actual cart data
const mockCartItems: CartItem[] = [
  { id: 'prod-1-m', productId: 'prod-1', name: 'Himalayan Breeze Jacket (M)', price: 12000, quantity: 1, imageUrl: 'https://placehold.co/80x80.png?text=Jacket', dataAiHint: "product fashion" },
  { id: 'prod-2', productId: 'prod-2', name: 'Kathmandu Comfort Tee', price: 3500, quantity: 2, imageUrl: 'https://placehold.co/80x80.png?text=Tee', dataAiHint: "product fashion" },
];

const DOMESTIC_SHIPPING_COST_NPR = 500;

export default function CheckoutPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [subtotal, setSubtotal] = useState(0);
  const [currentShippingCost, setCurrentShippingCost] = useState(DOMESTIC_SHIPPING_COST_NPR);
  const [total, setTotal] = useState(0);
  const [isInternationalShipping, setIsInternationalShipping] = useState(false);
  const [internationalShippingInfo, setInternationalShippingInfo] = useState<CalculateInternationalShippingOutput | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card_nepal'); 

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
        saveInfo: true,
        paymentMethod: 'card_nepal',
        country: 'Nepal', 
        isInternational: false,
    },
  });

  useEffect(() => {
    const newSubtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setSubtotal(newSubtotal);
  }, []);

  useEffect(() => {
    setTotal(subtotal + currentShippingCost);
  }, [subtotal, currentShippingCost]);

  const handleCountryChange = (countryValue: string) => {
    const isInternational = countryValue.toLowerCase() !== 'nepal';
    setIsInternationalShipping(isInternational);
    form.setValue('isInternational', isInternational);
    if (isInternational) {
      form.setValue('internationalDestinationCountry', countryValue);
      setCurrentShippingCost(0); 
      setInternationalShippingInfo(null);
      if (selectedPaymentMethod !== 'card_international') {
        setSelectedPaymentMethod('card_international'); // Default to international card if country changes to int'l
        form.setValue('paymentMethod', 'card_international');
      }
    } else {
      form.setValue('internationalDestinationCountry', '');
      setCurrentShippingCost(DOMESTIC_SHIPPING_COST_NPR);
      setInternationalShippingInfo(null);
       if (selectedPaymentMethod === 'card_international') {
        setSelectedPaymentMethod('card_nepal'); // Default back to local card if country changes to Nepal
        form.setValue('paymentMethod', 'card_nepal');
      }
    }
  };

  const handleCalculateInternationalShipping = async () => {
    const destinationCountry = form.getValues("internationalDestinationCountry");
    if (!destinationCountry) {
      toast({ title: "Error", description: "Please enter a destination country.", variant: "destructive" });
      return;
    }
    setIsCalculatingShipping(true);
    setInternationalShippingInfo(null);
    try {
      const result = await calculateInternationalShipping({ destinationCountry });
      setInternationalShippingInfo(result);
      setCurrentShippingCost(result.rateNPR);
      toast({ title: "Shipping Calculated", description: `Shipping to ${destinationCountry}: रू${result.rateNPR}, Estimated Delivery: ${result.estimatedDeliveryTime}` });
    } catch (error) {
      console.error("Error calculating international shipping:", error);
      toast({ title: "Shipping Calculation Failed", description: (error as Error).message || "Could not calculate shipping at this time.", variant: "destructive" });
      setCurrentShippingCost(0); 
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    const orderPayload = {
      cartItems: mockCartItems, // In real app, get from cart context/state
      shippingDetails: data,
      orderSubtotal: subtotal,
      shippingCost: currentShippingCost,
      orderTotal: total,
    };

    form.control.handleSubmit(async () => { // Ensure RHF state is current
      try {
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        });

        const result = await response.json();

        if (response.ok) {
          toast({
            title: "Order Placed (Mock)!",
            description: result.message || "Your order is being processed.",
            action: <Link href="/account/orders"><Button variant="outline" size="sm">View Orders</Button></Link>
          });
          // Clear cart, redirect to order confirmation, etc.
          // router.push(`/order-confirmation/${result.orderId}`); // If orderId is returned
          form.reset(); // Reset form
          // Potentially reset cart state here
        } else {
          toast({
            title: "Order Failed",
            description: result.message || "There was an issue placing your order.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to submit order:", error);
        toast({
          title: "Order Submission Error",
          description: "Could not connect to the server. Please try again.",
          variant: "destructive",
        });
      }
    })(data); // Pass data to the wrapped RHF submit handler
  };

  const paymentMethods = [
    { value: 'card_nepal', label: 'Credit/Debit Card (Nepal)', icon: CreditCard, domesticOnly: true },
    { value: 'cod', label: 'Cash on Delivery (Nepal Only, 10% Advance May Be Required)', icon: Banknote, domesticOnly: true },
    { value: 'esewa', label: 'eSewa', icon: Send, domesticOnly: true }, 
    { value: 'khalti', label: 'Khalti', icon: Send, domesticOnly: true },
    { value: 'imepay', label: 'IME Pay', icon: Send, domesticOnly: true },
    { value: 'connectips', label: 'ConnectIPS', icon: Globe, domesticOnly: true },
    { value: 'qr', label: 'QR Payment (Fonepay, etc.)', icon: QrCode, domesticOnly: true },
    { value: 'banktransfer', label: 'Bank Transfer (Mobile App)', icon: Banknote, domesticOnly: true },
    { value: 'card_international', label: 'Credit/Debit Card (International)', icon: CreditCard, internationalOnly: true },
  ];


  return (
    <div className="container-slim py-12 md:py-20">
      <div className="text-center mb-12">
        <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Complete Your Purchase</h1>
        <p className="text-muted-foreground mt-2">Securely enter your shipping and payment details.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
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
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nepal" 
                          onChange={(e) => {
                            field.onChange(e);
                            handleCountryChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {isInternationalShipping && (
                    <FormField
                        control={form.control}
                        name="internationalDestinationCountry"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Destination Country (Confirm for Int'l Shipping)</FormLabel>
                            <div className="flex gap-2">
                            <FormControl>
                                <Input {...field} placeholder="Enter destination country" 
                                  onChange={(e) => {
                                      field.onChange(e);
                                      // Automatically update if country field changes directly
                                      if (e.target.value.toLowerCase() !== 'nepal' && !isInternationalShipping) {
                                          handleCountryChange(e.target.value);
                                      } else if (e.target.value.toLowerCase() === 'nepal' && isInternationalShipping) {
                                          handleCountryChange(e.target.value);
                                      }
                                  }}
                                />
                            </FormControl>
                            <Button type="button" onClick={handleCalculateInternationalShipping} disabled={isCalculatingShipping}>
                                {isCalculatingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4 mr-1"/>}
                                Calculate
                            </Button>
                            </div>
                             {internationalShippingInfo && (
                                <div className="mt-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                                    <p>Est. Cost: <span className="font-semibold text-primary">रू{internationalShippingInfo.rateNPR.toLocaleString()}</span></p>
                                    <p>Est. Delivery: <span className="font-semibold">{internationalShippingInfo.estimatedDeliveryTime}</span></p>
                                    {internationalShippingInfo.disclaimer && <p className="text-xs mt-1 italic"><Info className="inline h-3 w-3 mr-1"/>{internationalShippingInfo.disclaimer}</p>}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                 <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone (Optional, for delivery updates)</FormLabel><FormControl><Input type="tel" {...field} placeholder="+977 98********" /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><CreditCard className="mr-3 h-6 w-6 text-primary"/>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedPaymentMethod(value);
                          }}
                          value={field.value} // Ensure RHF controls the value
                          className="flex flex-col space-y-1"
                        >
                          {paymentMethods
                            .filter(pm => isInternationalShipping ? pm.internationalOnly : pm.domesticOnly)
                            .map(pm => (
                            <FormItem key={pm.value} className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
                                <FormControl>
                                <RadioGroupItem value={pm.value} />
                                </FormControl>
                                <pm.icon className="h-5 w-5 text-muted-foreground" />
                                <FormLabel className="font-normal cursor-pointer flex-grow">{pm.label}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {(selectedPaymentMethod === 'card_nepal') && !isInternationalShipping && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <p className="text-md font-semibold text-foreground">Card Payment (Nepal)</p>
                     <p className="text-sm text-muted-foreground">You will be redirected to a secure local payment gateway to complete your payment.</p>
                  </div>
                )}

                {selectedPaymentMethod === 'card_international' && isInternationalShipping && (
                    <div className="mt-6 pt-6 border-t space-y-4">
                        <p className="text-md font-semibold text-foreground">Enter Card Details (International)</p>
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
                    </div>
                )}

                 {selectedPaymentMethod === 'cod' && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
                        <Info className="inline h-4 w-4 mr-1.5"/> A 10% advance payment might be required for Cash on Delivery orders. Our team will contact you for confirmation.
                    </div>
                 )}


                 <div className="flex items-center space-x-2 mt-6">
                    <FormField control={form.control} name="saveInfo" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-primary !mt-0.5" />
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
                       <Image src={item.imageUrl!} alt={item.name} width={40} height={40} className="rounded mr-3" data-ai-hint={item.dataAiHint || "product fashion"}/>
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
                  <p className="text-muted-foreground">Shipping {isInternationalShipping ? `(Int'l)` : `(Domestic)`}</p>
                  <p className="text-foreground">
                    {isCalculatingShipping ? <Loader2 className="h-4 w-4 animate-spin inline"/> : `रू${currentShippingCost.toLocaleString()}`}
                  </p>
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
                <Button type="submit" size="lg" className="w-full text-base" disabled={form.formState.isSubmitting || isCalculatingShipping}>
                  {form.formState.isSubmitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin"/> : <Lock className="mr-2 h-5 w-5" />} Place Order
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

