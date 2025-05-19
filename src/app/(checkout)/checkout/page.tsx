
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
import { CreditCard, Lock, ShoppingBag, Truck, Gift, Globe, Info, Loader2, Banknote, QrCode, Send, CheckCircle, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context'; 
import { calculateInternationalShipping } from '@/ai/flows/calculate-international-shipping-flow';
import type { CalculateInternationalShippingOutput } from '@/ai/flows/calculate-international-shipping-flow';
import { useRouter } from 'next/navigation';

function luhnCheck(val: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  const numStr = val.replace(/\D/g, "");

  if (numStr.length < 13 || numStr.length > 19) return false; // Basic length check for common cards

  for (let i = numStr.length - 1; i >= 0; i--) {
    let digit = parseInt(numStr.charAt(i));

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0 && numStr.length > 0;
}

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
  cardNumber: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')), // MM/YY
  cvc: z.string().optional().or(z.literal('')),
  cardholderName: z.string().optional().or(z.literal('')),
});

const checkoutSchema = shippingSchema.extend({
    promoCode: z.string().optional(),
    saveInfo: z.boolean().default(false).optional(),
    paymentMethod: z.string().min(1, "Please select a payment method."),
}).merge(paymentCardSchema)
.superRefine((data, ctx) => {
    if (data.paymentMethod === 'card_international' && data.isInternational) {
        if (!data.cardholderName || data.cardholderName.trim().length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cardholder name is required.", path: ["cardholderName"] });
        }
        if (!data.cardNumber || data.cardNumber.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Card number is required.", path: ["cardNumber"] });
        } else if (!luhnCheck(data.cardNumber)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid credit card number.", path: ["cardNumber"] });
        }

        if (!data.expiryDate || data.expiryDate.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expiry date is required.", path: ["expiryDate"] });
        } else {
            const expiryMatch = data.expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/);
            if (!expiryMatch) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expiry date must be MM/YY.", path: ["expiryDate"] });
            } else {
                const [, month, year] = expiryMatch;
                const currentFullYear = new Date().getFullYear();
                const currentYear = currentFullYear % 100;
                const currentMonth = new Date().getMonth() + 1;
                const inputYear = parseInt(year, 10);
                const inputMonth = parseInt(month, 10);

                if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Card has expired.", path: ["expiryDate"] });
                } else if (inputYear > currentYear + 20) { // Arbitrary future limit
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expiry date seems too far in the future.", path: ["expiryDate"] });
                }
            }
        }
        
        if (!data.cvc || data.cvc.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CVC is required.", path: ["cvc"] });
        } else if (!/^\d{3,4}$/.test(data.cvc.trim())) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CVC must be 3 or 4 digits.", path: ["cvc"] });
        }
    }
    if (data.isInternational && (!data.internationalDestinationCountry || data.internationalDestinationCountry.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Destination country is required for international shipping.",
            path: ["internationalDestinationCountry"],
        });
    }
});


type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const DOMESTIC_SHIPPING_COST_NPR = 500;

export default function CheckoutPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { cartItems, subtotal, clearCart, isCartLoading } = useCart();
  
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
        internationalDestinationCountry: '',
        fullName: '',
        streetAddress: '',
        apartmentSuite: '',
        city: '',
        postalCode: '',
        phone: '',
        promoCode: '',
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvc: '',
    },
  });

  useEffect(() => {
    if (!isCartLoading && cartItems.length === 0) {
        toast({ title: "Cart Empty", description: "Your cart is empty. Redirecting to shop...", variant: "default" });
        router.push('/products');
    }
  }, [cartItems, isCartLoading, router, toast]);

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
        setSelectedPaymentMethod('card_international'); 
        form.setValue('paymentMethod', 'card_international');
      }
    } else {
      form.setValue('internationalDestinationCountry', '');
      setCurrentShippingCost(DOMESTIC_SHIPPING_COST_NPR);
      setInternationalShippingInfo(null);
       if (selectedPaymentMethod === 'card_international') {
        setSelectedPaymentMethod('card_nepal'); 
        form.setValue('paymentMethod', 'card_nepal');
      }
    }
  };

  const handleCalculateInternationalShipping = async () => {
    const destinationCountry = form.getValues("internationalDestinationCountry");
    if (!destinationCountry || destinationCountry.trim() === '') {
      toast({ title: "Error", description: "Please enter a destination country.", variant: "destructive" });
      return;
    }
    setIsCalculatingShipping(true);
    setInternationalShippingInfo(null);
    try {
      const result = await calculateInternationalShipping({ destinationCountry });
      setInternationalShippingInfo(result);
      setCurrentShippingCost(result.rateNPR);
      toast({ 
        title: "Shipping Calculated", 
        description: (
          <div>
            <p>Shipping to {destinationCountry}: रू{result.rateNPR.toLocaleString()}</p>
            <p>Estimated Delivery: {result.estimatedDeliveryTime}</p>
          </div>
        ),
        action: <CheckCircle className="text-green-500"/> 
      });
    } catch (error) {
      console.error("Error calculating international shipping:", error);
      toast({ title: "Shipping Calculation Failed", description: (error as Error).message || "Could not calculate shipping at this time.", variant: "destructive" });
      setCurrentShippingCost(0); 
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    const isValid = await form.trigger();
    if (!isValid) {
        toast({
            title: "Validation Error",
            description: "Please review the form for errors and try again.",
            variant: "destructive",
        });
        console.log("Form validation errors:", form.formState.errors);
        return;
    }
    
    const orderPayload = {
      cartItems: cartItems, 
      shippingDetails: data,
      orderSubtotal: subtotal, 
      shippingCost: currentShippingCost,
      orderTotal: total,
    };

    console.log("Submitting order with payload:", JSON.stringify(orderPayload, null, 2));

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
          title: result.title || "Order Placed!",
          description: result.message || "Your order is being processed.",
          action: <Link href={`/account/orders?orderId=${result.orderId || 'new'}`}><Button variant="outline" size="sm">View Order</Button></Link>
        });
        clearCart(); 
        router.push(`/account/orders?orderId=${result.orderId || 'new'}`);
        form.reset(); 
      } else {
        toast({
          title: result.title || "Order Failed",
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
  };

  const paymentMethods = [
    { value: 'card_nepal', label: 'Credit/Debit Card (Nepal Gateways)', icon: CreditCard, domesticOnly: true, internationalOnly: false },
    { value: 'cod', label: 'Cash on Delivery (Nepal Only)', icon: Banknote, domesticOnly: true, internationalOnly: false },
    { value: 'esewa', label: 'eSewa Mobile Wallet', icon: Send, domesticOnly: true, internationalOnly: false }, 
    { value: 'khalti', label: 'Khalti Digital Wallet', icon: Send, domesticOnly: true, internationalOnly: false },
    { value: 'imepay', label: 'IME Pay Wallet', icon: Send, domesticOnly: true, internationalOnly: false },
    { value: 'connectips', label: 'ConnectIPS (Bank Account)', icon: Globe, domesticOnly: true, internationalOnly: false },
    { value: 'qr', label: 'Scan QR (Fonepay, NepalPay, etc.)', icon: QrCode, domesticOnly: true, internationalOnly: false },
    { value: 'banktransfer', label: 'Direct Bank Transfer (Mobile Banking)', icon: Banknote, domesticOnly: true, internationalOnly: false },
    { value: 'card_international', label: 'Credit/Debit Card (International)', icon: CreditCard, domesticOnly: false, internationalOnly: true },
  ];

  if (isCartLoading) {
    return (
      <div className="container-slim py-12 md:py-20 flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
                                      if (e.target.value.toLowerCase() !== 'nepal' && !isInternationalShipping) {
                                          handleCountryChange(e.target.value);
                                      } else if (e.target.value.toLowerCase() === 'nepal' && isInternationalShipping) {
                                          handleCountryChange(e.target.value);
                                      }
                                  }}
                                />
                            </FormControl>
                            <Button type="button" onClick={handleCalculateInternationalShipping} disabled={isCalculatingShipping || !field.value}>
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
                          value={field.value}
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
                     <p className="text-sm text-muted-foreground">You will be redirected to a secure local payment gateway (e.g., Nabil, NIC Asia) to complete your payment after placing the order.</p>
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
                            <FormItem><FormLabel>Expiry Date (MM/YY)</FormLabel><FormControl><Input {...field} placeholder="MM/YY" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="cvc" render={({ field }) => (
                            <FormItem><FormLabel>CVC/CVV</FormLabel><FormControl><Input {...field} placeholder="123" /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                )}

                 {selectedPaymentMethod === 'cod' && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
                        <Info className="inline h-4 w-4 mr-1.5"/> For Cash on Delivery orders, a 10% advance payment might be required for confirmation, especially for high-value items. Our team will contact you.
                    </div>
                 )}


                 <div className="flex items-center space-x-2 mt-6">
                    <FormField control={form.control} name="saveInfo" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <input type="checkbox" checked={field.value} onChange={field.onChange} id="saveInfoCheckbox" className="h-4 w-4 accent-primary !mt-0.5 rounded border-gray-300 focus:ring-primary" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <Label htmlFor="saveInfoCheckbox" className="cursor-pointer">Save this information for next time</Label>
                        </div>
                        </FormItem>
                    )} />
                </div>
                 <p className="text-xs text-muted-foreground flex items-center mt-4"><Lock className="h-3 w-3 mr-1.5 text-green-600"/> Your payment information is encrypted and secure.</p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 sticky top-24">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-sm pb-2 mb-2 border-b border-dashed last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex items-start mr-2">
                       <Image src={item.customization?.predefinedDesign?.imageUrl || item.imageUrl!} alt={item.name} width={40} height={40} className="rounded mr-3 mt-0.5" data-ai-hint={item.dataAiHint || "product fashion"}/>
                       <div>
                           <p className="text-foreground font-medium leading-tight">{item.name}</p>
                           <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            {item.customization && (
                            <div className="mt-1 text-xs">
                                <p className="font-medium text-primary/80 flex items-center"><Palette size={12} className="mr-1"/>Customized:</p>
                                {item.customization.type === 'predefined' && item.customization.predefinedDesign && (
                                <p className="text-muted-foreground pl-2">&bull; Design: {item.customization.predefinedDesign.name}</p>
                                )}
                                {item.customization.customDescription && (
                                <p className="text-muted-foreground pl-2 truncate w-40">&bull; Idea: {item.customization.customDescription}</p>
                                )}
                                {item.customization.instructions && (
                                <p className="text-muted-foreground pl-2 truncate w-40">&bull; Notes: {item.customization.instructions}</p>
                                )}
                            </div>
                            )}
                       </div>
                    </div>
                    <p className="text-foreground whitespace-nowrap">रू{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="text-foreground">रू{subtotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Shipping {isInternationalShipping ? `(Int'l to ${form.getValues("internationalDestinationCountry") || 'destination'})` : `(Domestic)`}</p>
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
                <Button type="submit" size="lg" className="w-full text-base" disabled={form.formState.isSubmitting || isCalculatingShipping || cartItems.length === 0}>
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


    