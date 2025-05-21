
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Plus, Minus, ShoppingCart, ShieldCheck, Package, Zap, Loader2, Paintbrush, Edit2, Info, Heart as HeartIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { Product, ProductImage, BreadcrumbItem, ProductVariant, CartItemCustomization, PrintDesign, Review } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ProductCard } from '@/components/product/product-card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from '@/components/ui/rating-stars';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem as RHFFormItem, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function ProductDetailPage({ params: paramsPromise }: { params: Promise<{ slug: string }> | { slug:string } }) {
  const resolvedParams = React.use(paramsPromise as Promise<{ slug: string }>);
  
  const { toast } = useToast();
  const { addToCart: addToCartContext } = useCart();
  const { user, isAuthenticated, isLoading: authIsLoading, refreshUserProfile } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

  const [customizationType, setCustomizationType] = useState<'predefined' | 'custom' | null>(null);
  const [selectedPredefinedDesign, setSelectedPredefinedDesign] = useState<PrintDesign | null>(null);
  const [customDesignDescription, setCustomDesignDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchProductData = useCallback(async () => {
    if (!resolvedParams?.slug) {
      setError("Product slug not available.");
      setIsLoading(false);
      setProduct(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setProduct(null); 

    console.log(`[ProductDetail] Fetching product with slug: ${resolvedParams.slug}`);
    try {
      const response = await fetch(`/api/products/${resolvedParams.slug}`);
      if (!response.ok) {
        let errorMsg = `Product with slug '${resolvedParams.slug}' not found.`;
        if (response.status !== 404) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorData.rawSupabaseError?.message || `Error ${response.status}: ${response.statusText}`;
          } catch (e) {
            errorMsg = `Error ${response.status}: ${response.statusText}. Failed to parse error response.`;
          }
        }
        console.error("[ProductDetail] Error from API:", errorMsg);
        setError(errorMsg);
        setProduct(null);
        setIsLoading(false); // Stop loading
        return; // Exit early, error state will handle UI
      }
      const currentProduct: Product = await response.json();

      if (currentProduct) {
        console.log(`[ProductDetail] Product found:`, currentProduct.name);
        setProduct(currentProduct);
        setSelectedImage(currentProduct.images[0] || null);
        
        if (currentProduct.variants && currentProduct.variants.length > 0) {
          const firstAvailableVariant = currentProduct.variants.find(v => v.stock > 0);
          setSelectedVariantId(firstAvailableVariant ? firstAvailableVariant.id : currentProduct.variants[0].id);
        }
        if (currentProduct.customizationConfig?.enabled) {
          if (currentProduct.customizationConfig.allowPredefinedDesigns && currentProduct.availablePrintDesigns && currentProduct.availablePrintDesigns.length > 0) {
            setCustomizationType('predefined');
          } else if (currentProduct.customizationConfig.allowCustomDescription) {
            setCustomizationType('custom');
          }
        }
      } else {
        // This case might be redundant if API always returns 404 or product
        setError(`Product with slug '${resolvedParams.slug}' not found or data is invalid.`);
        setProduct(null);
      }
    } catch (err) { // This catch block handles network errors or if response.json() fails
      console.error("[ProductDetail] Network or JSON parsing error fetching product data:", err);
      setError((err as Error).message || "Could not load product data due to a network or parsing issue.");
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams?.slug]); 

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const fetchRelatedProducts = useCallback(async () => {
      if (!product || !product.categories || product.categories.length === 0) return;
      try {
          // For now, fetch all products and filter. Could be optimized with a dedicated API.
          const allProductsResponse = await fetch('/api/products'); 
          if (allProductsResponse.ok) {
              const allProducts: Product[] = await allProductsResponse.json();
              const related = allProducts.filter(
                  p => p.id !== product.id &&
                  product.categories.some(ccat => p.categories.map(pcat => pcat.slug).includes(ccat.slug))
              ).slice(0, 4); // Show up to 4 related products
              setRelatedProducts(related);
          } else {
              console.warn("[ProductDetail] Failed to fetch all products for related items.");
          }
      } catch (err) {
          console.error("[ProductDetail] Error fetching related products:", err);
      }
  }, [product]);

  useEffect(() => {
    if (product) {
        fetchRelatedProducts();
    }
  }, [product, fetchRelatedProducts]);

  useEffect(() => {
    if (isAuthenticated && user?.wishlist && product) {
      setIsWishlisted(user.wishlist.includes(product.id));
    } else {
      setIsWishlisted(false);
    }
  }, [user, product, isAuthenticated]);


  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const displayCompareAtPrice = selectedVariant?.costPrice !== undefined 
    ? undefined  // If variant has costPrice, assume it's specific and don't show base compareAtPrice
    : product?.compareAtPrice;

  const isOutOfStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock <= 0;
    if (product?.variants && product.variants.length > 0 && !selectedVariant) return true; // Must select a variant if variants exist
    return (product?.stock !== undefined && product.stock <= 0 && (!product?.variants || product.variants.length === 0));
  }, [product, selectedVariant]);

  const handleAddToCart = () => {
    if (!product) return;
    if (isOutOfStock) {
        toast({ title: "Out of Stock", description: "This item is currently unavailable.", variant: "destructive" });
        return;
    }
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
        toast({ title: "Select Variant", description: `Please select a ${product.variants[0]?.name || 'variant'}.`, variant: "destructive" });
        return;
    }

    let cartCustomization: CartItemCustomization | undefined = undefined;
    if (product.customizationConfig?.enabled && customizationType) {
      if (customizationType === 'predefined' && selectedPredefinedDesign) {
        cartCustomization = {
          type: 'predefined',
          predefinedDesign: {
            id: selectedPredefinedDesign.id,
            name: selectedPredefinedDesign.name,
            imageUrl: selectedPredefinedDesign.imageUrl,
          },
          instructions: customInstructions || undefined,
        };
      } else if (customizationType === 'custom' && (customDesignDescription || customInstructions)) {
        if (!customDesignDescription && product.customizationConfig.allowCustomDescription) {
             toast({ title: "Custom Design", description: "Please describe your custom design idea.", variant: "default" });
             return;
        }
        cartCustomization = {
          type: 'custom',
          customDescription: customDesignDescription || undefined,
          instructions: customInstructions || undefined,
        };
      }
    }
    addToCartContext(product, quantity, selectedVariant, cartCustomization);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated || !user || !product) {
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
        throw new Error(errorData.message || errorData.rawError || `Failed to update wishlist`);
      }
      await refreshUserProfile(); 
      toast({
        title: !isWishlisted ? "Added to Wishlist" : "Removed from Wishlist",
      });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !product) {
      toast({ title: "Please Login", description: "You need to be logged in to submit a review.", variant: "default" });
      return;
    }
    if (reviewRating === 0) {
      toast({ title: "Rating Required", description: "Please select a star rating.", variant: "destructive" });
      return;
    }
    if (reviewComment.trim().length < 10) {
      toast({ title: "Comment Too Short", description: "Please write a comment of at least 10 characters.", variant: "destructive" });
      return;
    }

    setIsSubmittingReview(true);
    console.log("Submitting review (mock):", { productId: product.id, userId: user.id, rating: reviewRating, title: reviewTitle, comment: reviewComment });
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
    setReviewRating(0);
    setReviewTitle('');
    setReviewComment('');
    setIsSubmittingReview(false);
  };


  if (isLoading || authIsLoading) {
    return (
      <div className="container-wide section-padding flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Product Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide section-padding text-center">
        <h1 className="text-2xl font-bold text-destructive">{error}</h1>
        <Button asChild variant="link" className="mt-4"><Link href="/products">Back to Shop</Link></Button>
      </div>
    );
  }
  
  if (!product) { 
     return ( 
      <div className="container-wide section-padding text-center">
        <h1 className="text-2xl font-bold text-destructive">Product data could not be loaded or was not found.</h1>
        <Button asChild variant="link" className="mt-4"><Link href="/products">Back to Shop</Link></Button>
      </div>
    );
  }
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/products' },
    ...(product.categories[0] ? [{ name: product.categories[0].name, href: `/products?category=${product.categories[0].slug}` }] : []),
    { name: product.name || resolvedParams.slug },
  ];

  return (
    <div className="container-wide section-padding">
      <div className="mb-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-24 p-1 rounded-lg bg-background z-10">
          <div className="mb-4">
             <AspectRatio ratio={4/5} className="bg-muted rounded-lg overflow-hidden shadow-lg">
               {selectedImage && (
                <Image
                    src={selectedImage.url}
                    alt={selectedImage.altText || product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-opacity duration-300 ease-in-out hover:opacity-90"
                    priority
                    data-ai-hint={selectedImage.dataAiHint || "product fashion"}
                />
                )}
             </AspectRatio>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {product.images.map(img => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`rounded-md overflow-hidden border-2 transition-all ${selectedImage?.id === img.id ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-primary/50'}`}
              >
                <AspectRatio ratio={1/1}>
                <Image src={img.url} alt={img.altText || `Thumbnail ${img.id}`} fill sizes="25vw" className="object-cover" data-ai-hint={img.dataAiHint || "clothing detail"} />
                </AspectRatio>
              </button>
            ))}
          </div>
        </div>

        <div>
          {product.categories[0] && <span className="text-sm text-primary font-medium uppercase tracking-wider">{product.categories[0].name}</span>}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-1">
            <RatingStars rating={product.averageRating || 0} size={20} />
            <span className="ml-2 text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
          </div>
          <Button variant="link" className="px-0 h-auto text-sm text-primary mb-5" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({behavior: 'smooth'})}>
            Write a review
          </Button>

          <p className="text-3xl font-semibold text-primary mb-3">
            रू{displayPrice.toLocaleString()}
            {displayCompareAtPrice && (
              <span className="ml-3 text-xl text-muted-foreground line-through">
                रू{displayCompareAtPrice.toLocaleString()}
              </span>
            )}
          </p>
          {displayCompareAtPrice && displayCompareAtPrice > displayPrice && <Badge variant="destructive" className="mb-5 text-sm py-1 px-2">SALE</Badge>}
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{product.shortDescription}</p>

          {product.variants && product.variants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-md font-semibold text-foreground mb-3">
                Select {product.variants[0].name}: <span className="text-primary">{selectedVariant?.value}</span>
              </h3>
              <RadioGroup
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
                className="flex flex-wrap gap-3"
              >
                {product.variants.map(variant => (
                  <div key={variant.id}>
                    <RadioGroupItem
                      value={variant.id}
                      id={`variant-${variant.id}`}
                      className="sr-only"
                      disabled={variant.stock <= 0}
                    />
                    <Label
                      htmlFor={`variant-${variant.id}`}
                      className={`
                        px-5 py-2.5 border rounded-md text-sm font-medium cursor-pointer transition-all
                        ${selectedVariantId === variant.id ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2' : 'bg-card hover:bg-muted/50 border-border'}
                        ${variant.stock <= 0 ? 'opacity-50 cursor-not-allowed line-through' : ''}
                      `}
                    >
                      {variant.value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock < 5 && (
                <p className="text-sm text-orange-500 mt-2">Only {selectedVariant.stock} left in stock!</p>
              )}
               {selectedVariant && selectedVariant.stock <= 0 && (
                <p className="text-sm text-destructive mt-2">This size is out of stock.</p>
              )}
            </div>
          )}

          {product.customizationConfig?.enabled && (
            <Card className="mb-8 shadow-md border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center"><Paintbrush className="mr-2 h-5 w-5 text-primary"/>Customize Your Product</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={customizationType || undefined} onValueChange={(value) => setCustomizationType(value as 'predefined' | 'custom' | null)}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    {product.customizationConfig.allowPredefinedDesigns && product.availablePrintDesigns && product.availablePrintDesigns.length > 0 && (
                        <TabsTrigger value="predefined">{product.customizationConfig.predefinedDesignsLabel || 'Choose a Signature Design'}</TabsTrigger>
                    )}
                    {product.customizationConfig.allowCustomDescription && (
                        <TabsTrigger value="custom">{product.customizationConfig.customDescriptionLabel || 'Describe Your Own'}</TabsTrigger>
                    )}
                  </TabsList>

                  {product.customizationConfig.allowPredefinedDesigns && product.availablePrintDesigns && product.availablePrintDesigns.length > 0 && (
                    <TabsContent value="predefined">
                        <Label className="text-md font-semibold text-foreground mb-2 block">
                            {product.customizationConfig.predefinedDesignsLabel || 'Choose a Signature Design'}
                        </Label>
                        <RadioGroup 
                            value={selectedPredefinedDesign?.id} 
                            onValueChange={(id) => setSelectedPredefinedDesign(product.availablePrintDesigns?.find(d => d.id === id) || null)}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4"
                        >
                            {product.availablePrintDesigns.map(design => (
                                <Label 
                                    key={design.id} 
                                    htmlFor={`design-${design.id}`}
                                    className={`border rounded-md p-2 cursor-pointer hover:border-primary transition-all flex flex-col items-center space-y-2
                                        ${selectedPredefinedDesign?.id === design.id ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                                >
                                    <RadioGroupItem value={design.id} id={`design-${design.id}`} className="sr-only" />
                                    <AspectRatio ratio={1/1} className="w-20 h-20 bg-muted rounded overflow-hidden">
                                      <Image src={design.imageUrl} alt={design.name} fill sizes="10vw" className="object-contain" data-ai-hint={design.dataAiHint || "design graphic"}/>
                                    </AspectRatio>
                                    <span className="text-xs text-center font-medium">{design.name}</span>
                                </Label>
                            ))}
                        </RadioGroup>
                    </TabsContent>
                  )}
                  
                  {product.customizationConfig.allowCustomDescription && (
                     <TabsContent value="custom">
                        <FormFieldItem>
                            <Label className="text-md font-semibold text-foreground mb-2 block">
                                {product.customizationConfig.customDescriptionLabel || 'Describe Your Design Idea'}
                            </Label>
                            <Textarea 
                                placeholder="e.g., 'A silhouette of a mountain range with a rising sun', or 'The text Peak Pulse in Nepali script'" 
                                value={customDesignDescription} 
                                onChange={(e) => setCustomDesignDescription(e.target.value)}
                                rows={3}
                            />
                        </FormFieldItem>
                    </TabsContent>
                  )}
                </Tabs>
                
                {product.customizationConfig.allowInstructions && (customizationType === 'predefined' || customizationType === 'custom') && (
                    <div className="mt-4">
                         <FormFieldItem>
                             <Label className="text-md font-semibold text-foreground mb-2 block">
                                {product.customizationConfig.instructionsLabel || 'Specific Instructions (Placement, Colors, etc.)'}
                            </Label>
                            <Textarea 
                                placeholder="e.g., 'Place design on the back, centered', or 'Use gold thread for the script'" 
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                rows={3} 
                            />
                        </FormFieldItem>
                    </div>
                )}
                 {customizationType && <p className="text-xs text-muted-foreground mt-3 flex items-center"><Info className="h-3 w-3 mr-1.5"/>Customized items may have longer processing times and might be non-returnable. Check policy.</p>}
              </CardContent>
            </Card>
          )}

          <div className="flex items-stretch gap-4 mb-8">
            <div className="flex items-center border rounded-md h-12">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-full rounded-r-none" aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-5 text-lg font-medium w-12 text-center flex items-center justify-center h-full">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="h-full rounded-l-none" aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-grow text-base h-12" onClick={handleAddToCart} disabled={isOutOfStock}>
              <ShoppingCart className="mr-2 h-5 w-5" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12" 
                onClick={handleToggleWishlist} 
                disabled={isWishlistLoading || authIsLoading}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
                {isWishlistLoading || authIsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> :
                <HeartIcon className={cn("h-5 w-5", isWishlisted ? "fill-pink-500 text-pink-500" : "text-foreground")} />}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500"/>Secure Checkout</div>
            <div className="flex items-center"><Package className="h-5 w-5 mr-2 text-blue-500"/>Ethically Sourced</div>
            <div className="flex items-center"><Zap className="h-5 w-5 mr-2 text-yellow-500"/>Fast Shipping</div>
          </div>

          <Accordion type="single" collapsible defaultValue="description" className="w-full">
            <AccordionItem value="description">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">Product Description</AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: product.description }} />
            </AccordionItem>
            {product.fabricDetails && (
              <AccordionItem value="fabric">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">Fabric & Composition</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{product.fabricDetails}</AccordionContent>
              </AccordionItem>
            )}
            {product.careInstructions && (
              <AccordionItem value="care">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">Care Instructions</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{product.careInstructions}</AccordionContent>
              </AccordionItem>
            )}
             {product.sustainabilityMetrics && (
              <AccordionItem value="sustainability">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">Sustainability</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{product.sustainabilityMetrics}</AccordionContent>
              </AccordionItem>
            )}
            {product.fitGuide && (
              <AccordionItem value="fit">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">Fit Guide</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{product.fitGuide}</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>
      
       <Separator className="my-16" />

      <section id="reviews-section" className="space-y-12">
        <h2 className="text-3xl font-bold text-center text-foreground">Customer Reviews</h2>
        {product.reviews && product.reviews.length > 0 ? (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <RatingStars rating={product.averageRating || 0} size={28}/>
                <div >
                  <CardTitle className="text-2xl">{product.averageRating?.toFixed(1) || 'N/A'} out of 5</CardTitle>
                  <p className="text-sm text-muted-foreground">Based on {product.reviewCount} reviews</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {product.reviews.slice(0,3).map(review => (
                <div key={review.id} className="pb-6 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-3 mb-2">
                    <Avatar className="h-10 w-10 mt-0.5">
                      <AvatarImage src={review.userAvatarUrl || 'https://placehold.co/40x40.png'} alt={review.userName} data-ai-hint="user avatar generic"/>
                      <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{review.userName}</p>
                        {review.verifiedPurchase && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">Verified Purchase</Badge>}
                      </div>
                      <RatingStars rating={review.rating} size={16} className="mt-0.5"/>
                    </div>
                    <p className="text-xs text-muted-foreground ml-auto">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  {review.title && <h4 className="font-medium text-md text-foreground mb-1">{review.title}</h4>}
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {review.images.map(img => (
                        <AspectRatio key={img.id} ratio={1/1} className="bg-muted rounded-md overflow-hidden">
                          <Image src={img.url} alt={img.altText || 'Review image'} fill sizes="20vw" className="object-cover" data-ai-hint="review product image"/>
                        </AspectRatio>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {product.reviews.length > 3 && (
                <div className="text-center pt-4">
                    <Button variant="outline">View all {product.reviewCount} reviews (UI Only)</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-center text-muted-foreground py-8">No reviews yet for this product. Be the first!</p>
        )}

        {isAuthenticated && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Write Your Review</CardTitle>
              <CardDescription>Share your thoughts about {product.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Your Rating*</Label>
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setReviewRating(star)} aria-label={`Rate ${star} stars`}>
                        <Star className={cn("h-7 w-7 transition-colors", star <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40 hover:text-yellow-400/70")}/>
                      </button>
                    ))}
                  </div>
                </div>
                <FormFieldItem>
                  <Label htmlFor="reviewTitle">Review Title (Optional)</Label>
                  <Input id="reviewTitle" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="e.g., Amazing Quality!"/>
                </FormFieldItem>
                <FormFieldItem>
                  <Label htmlFor="reviewComment">Your Comment*</Label>
                  <Textarea id="reviewComment" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Tell us more about your experience..." rows={4} required minLength={10}/>
                </FormFieldItem>
                <FormFieldItem>
                    <Label htmlFor="reviewImages">Add Photos (Optional - UI Only)</Label>
                    <Input id="reviewImages" type="file" multiple disabled className="cursor-not-allowed opacity-70"/>
                    <p className="text-xs text-muted-foreground mt-1">Image upload functionality is not yet implemented.</p>
                </FormFieldItem>
                <Button type="submit" disabled={isSubmittingReview}>
                  {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Submit Review
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </section>

      {relatedProducts.length > 0 && (
        <>
            <Separator className="my-16" />
            <section>
                <h2 className="text-3xl font-bold text-center mb-12 text-foreground">You Might Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {relatedProducts.map(relatedProduct => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
                </div>
            </section>
        </>
      )}
    </div>
  );
}

// FormFieldItem is a simple wrapper, ensure it doesn't cause context issues
const FormFieldItem = ({ children }: { children: React.ReactNode }) => <div className="space-y-1.5">{children}</div>;
