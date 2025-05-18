
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Plus, Minus, ShoppingCart, Check, ShieldCheck, Package, Zap, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Product, ProductImage, BreadcrumbItem, ProductVariant } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ProductCard } from '@/components/product/product-card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useCart } from '@/context/cart-context';


export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { toast } = useToast();
  const { addToCart: addToCartContext } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products'); // Fetch all products
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const allProducts: Product[] = await response.json();
        const currentProduct = allProducts.find(p => p.slug === params.slug);

        if (currentProduct) {
          setProduct(currentProduct);
          setSelectedImage(currentProduct.images[0] || null);
          
          // Select first available variant by default
          if (currentProduct.variants && currentProduct.variants.length > 0) {
            const firstAvailableVariant = currentProduct.variants.find(v => v.stock > 0);
            if (firstAvailableVariant) {
              setSelectedVariantId(firstAvailableVariant.id);
            }
          }
          
          // Filter related products (e.g., from the same category, excluding current product)
          const related = allProducts.filter(
            p => p.id !== currentProduct.id && 
                 p.categories.some(cat => currentProduct.categories.map(ccat => ccat.slug).includes(cat.slug))
          ).slice(0, 4); // Show up to 4 related products
          setRelatedProducts(related);

        } else {
          toast({ title: "Error", description: "Product not found.", variant: "destructive" });
          // Optionally redirect: router.push('/404');
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        toast({ title: "Error", description: (error as Error).message || "Could not load product data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.slug) {
      fetchProductData();
    }
  }, [params.slug, toast]);
  
  
  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId);
  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : (product?.stock !== undefined && product.stock <= 0 && (!product?.variants || product.variants.length === 0));


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
    
    addToCartContext(product, quantity, selectedVariant);
  };


  if (isLoading) {
    return (
      <div className="container-wide section-padding flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-wide section-padding text-center">
        <h1 className="text-2xl font-bold text-destructive">Product Not Found</h1>
        <p className="text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
        <Button asChild variant="link" className="mt-4"><a href="/products">Back to Shop</a></Button>
      </div>
    );
  }
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/products' },
    { name: product.categories[0]?.name || 'Category', href: `/products?category=${product.categories[0]?.slug || ''}` }, 
    { name: product.name },
  ];

  return (
    <div className="container-wide section-padding">
      <div className="mb-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Image Gallery */}
        <div className="lg:sticky lg:top-24 z-10 bg-background p-1 rounded-lg shadow-sm">
          <div className="mb-4">
             <AspectRatio ratio={4/5} className="bg-muted rounded-lg overflow-hidden shadow-lg">
               {selectedImage && (
                <Image
                    src={selectedImage.url}
                    alt={selectedImage.altText || product.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-opacity duration-300 ease-in-out hover:opacity-90"
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
                <Image src={img.url} alt={img.altText || `Thumbnail ${img.id}`} layout="fill" objectFit="cover" data-ai-hint={img.dataAiHint || "clothing detail"} />
                </AspectRatio>
              </button>
            ))}
          </div>
        </div>

        {/* Product Information */}
        <div>
          {product.categories[0] && <span className="text-sm text-primary font-medium uppercase tracking-wider">{product.categories[0].name}</span>}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-5">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(product.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
              ))}
            </div>
            <span className="ml-2 text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
          </div>

          <p className="text-3xl font-semibold text-primary mb-3">
            रू{selectedVariant ? selectedVariant.price.toLocaleString() : product.price.toLocaleString()}
            {product.compareAtPrice && (
              <span className="ml-3 text-xl text-muted-foreground line-through">
                रू{product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </p>
          {product.compareAtPrice && product.compareAtPrice > product.price && <Badge variant="destructive" className="mb-5 text-sm py-1 px-2">SALE</Badge>}
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{product.shortDescription}</p>

          {/* Variants (e.g., Size) */}
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

          {/* Quantity Selector and Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex items-center border rounded-md h-12">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-full rounded-r-none" aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-5 text-lg font-medium w-12 text-center">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="h-full rounded-l-none" aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-grow text-base h-12" onClick={handleAddToCart} disabled={isOutOfStock}>
              <ShoppingCart className="mr-2 h-5 w-5" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
           {/* Trust Badges/USP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500"/>Secure Checkout</div>
            <div className="flex items-center"><Package className="h-5 w-5 mr-2 text-blue-500"/>Ethically Sourced</div>
            <div className="flex items-center"><Zap className="h-5 w-5 mr-2 text-yellow-500"/>Fast Shipping</div>
          </div>


          {/* Accordion for Details */}
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
      
      {/* Related Products Section */}
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
