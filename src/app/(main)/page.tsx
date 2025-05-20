
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { Icons } from '@/components/icons';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Instagram, Send, Users, ImagePlus, Loader2 } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import type { HomepageContent, Product, HeroSlide, SocialCommerceItem, UserPost } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Fallback content in case API fetch fails
const fallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-hero-1',
      title: "Peak Pulse (Fallback)",
      description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Content loading or temporarily unavailable).",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1920&h=1080&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      altText: "Fallback hero image: abstract fashion",
      dataAiHint: "fashion abstract modern",
      ctaText: "Explore Collections",
      ctaLink: "/products",
      videoId: undefined,
    }
  ],
  artisanalRoots: {
    title: "Our Artisanal Roots (Fallback)",
    description: "Details about our craftsmanship are currently unavailable. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen."
  },
  socialCommerceItems: [
    { id: 'social-fallback-1', imageUrl: 'https://placehold.co/400x400.png?text=Social+Fallback+1', linkUrl: 'https://instagram.com/peakpulsenp', altText: 'Social Post 1 Fallback', dataAiHint: 'social fashion fallback' },
  ],
};


async function getHomepageContent(): Promise<HomepageContent> {
  console.log("[Client Fetch] getHomepageContent called");
  try {
    const fetchUrl = `/api/content/homepage`; // Always use relative path for client-side fetch
    console.log(`[Client Fetch] Attempting to fetch from: ${fetchUrl}`);
    const res = await fetch(fetchUrl, { cache: 'no-store' });

    if (!res.ok) {
      let errorBody = "Could not read error response body.";
      try {
        errorBody = await res.text();
      } catch (e) {/* ignore */}
      console.error(`[Client Fetch] Failed to fetch content. Status: ${res.status} ${res.statusText}. Body:`, errorBody);
      throw new Error(`API Error fetching homepage content: ${res.status} ${res.statusText}. Details: ${errorBody.substring(0, 200)}`);
    }

    const data = await res.json();
    console.log("[Client Fetch] Successfully fetched homepage content:", data);

    // Ensure heroSlides is always an array and each slide has required fields
    const processedHeroSlides = (Array.isArray(data.heroSlides) ? data.heroSlides : []).map((slide: Partial<HeroSlide>) => ({
        ...fallbackContent.heroSlides![0], // Provide defaults for all fields from the first fallback slide
        ...slide, // Override with fetched data
        id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // Ensure ID
        imageUrl: slide.imageUrl || undefined,
        videoId: slide.videoId || undefined,
    })).filter(slide => slide.imageUrl || slide.videoId); // Only keep slides with media

    return {
      ...fallbackContent, // Start with fallback to ensure all sections always have some default structure
      ...data, // Override with fetched content where available
      heroSlides: processedHeroSlides.length > 0 ? processedHeroSlides : fallbackContent.heroSlides, // Ensure at least one valid slide
    };

  } catch (error) {
    console.error("[Client Fetch] CRITICAL ERROR in getHomepageContent:", error);
    // Return a structured fallback that won't break rendering
    return { 
        ...fallbackContent,
        heroSlides: fallbackContent.heroSlides?.map(slide => ({...slide, imageUrl: slide.imageUrl || "https://placehold.co/1920x1080.png?text=Content+Load+Error"})) || [],
    };
  }
}


const mockFeaturedProducts: Product[] = [
  { id: 'prod-1', name: 'Himalayan Breeze Jacket', slug: 'himalayan-breeze-jacket', price: 12000, images: [{ id: 'img-1', url: 'https://catalog-resize-images.thedoublef.com/606bc76216f1f9cb1ad8281eb9b7e84e/900/900/NF0A4QYXNY_P_NORTH-ZU31.a.jpg', altText: 'Himalayan Breeze Jacket', dataAiHint: 'jacket fashion' }], categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }], shortDescription: 'Lightweight and versatile.', createdAt: "2023-01-15T10:00:00Z", updatedAt: "2023-01-15T10:00:00Z", description: "Full description here." },
  { id: 'prod-2', name: 'Kathmandu Comfort Tee', slug: 'kathmandu-comfort-tee', price: 3500, images: [{ id: 'img-2', url: 'https://placehold.co/600x800.png', altText: 'Kathmandu Comfort Tee', dataAiHint: 'tee shirt' }], categories: [{ id: 'cat-2', name: 'Tops', slug: 'tops' }], shortDescription: 'Premium cotton for daily wear.', createdAt: "2023-02-01T09:00:00Z", updatedAt: "2023-02-01T09:00:00Z", description: "Full description here." },
  { id: 'prod-3', name: 'Urban Nomad Pants', slug: 'urban-nomad-pants', price: 7500, images: [{ id: 'img-3', url: 'https://placehold.co/600x800.png', altText: 'Urban Nomad Pants', dataAiHint: 'pants fashion' }], categories: [{ id: 'cat-3', name: 'Bottoms', slug: 'bottoms' }], shortDescription: 'Street-ready style.', createdAt: "2023-03-10T14:00:00Z", updatedAt: "2023-03-10T14:00:00Z", description: "Full description here." },
];


export default function HomePage() {
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [content, setContent] = useState<HomepageContent>(fallbackContent);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(true);

  const activeHeroSlides = content.heroSlides || fallbackContent.heroSlides || [];
  const currentHeroSlideData = activeHeroSlides.length > 0 
    ? activeHeroSlides[currentSlide % activeHeroSlides.length] 
    : fallbackContent.heroSlides![0];


  const loadContent = useCallback(async () => {
    console.log("[Client LoadContent] Initiating homepage content load.");
    setIsLoadingContent(true);
    try {
      const fetchedContent = await getHomepageContent();
      setContent(fetchedContent);
      console.log("[Client LoadContent] Set homepage content:", fetchedContent);
    } catch (error) {
      console.error("[Client LoadContent] Error setting homepage content:", error);
      toast({
        title: "Content Load Error",
        description: (error as Error).message || "Could not load homepage content. Displaying defaults.",
        variant: "destructive"
      });
      setContent(fallbackContent);
    } finally {
      setIsLoadingContent(false);
      console.log("[Client LoadContent] Homepage content load finished.");
    }
  }, [toast]);

  const loadUserPosts = useCallback(async () => {
    setIsLoadingUserPosts(true);
    try {
      const response = await fetch('/api/user-posts'); 
      if (!response.ok) {
        let errorDetail = 'Failed to fetch user posts';
        try {
            const errorData = await response.json();
            if (errorData.rawSupabaseError) {
                errorDetail = `Database error: ${errorData.rawSupabaseError.message || 'Unknown Supabase error.'}${errorData.rawSupabaseError.hint ? ` Hint: ${errorData.rawSupabaseError.hint}` : ''}`;
            } else if (errorData.message) {
                errorDetail = errorData.message;
            } else {
                errorDetail = `${response.status}: ${response.statusText || errorDetail}`;
            }
        } catch (e) {
            errorDetail = `${response.status}: ${response.statusText || errorDetail}`;
        }
        throw new Error(errorDetail);
      }
      const postsData: UserPost[] = await response.json();
      setUserPosts(postsData.slice(0, 4)); 
    } catch (error) {
      console.error("Error fetching user posts:", error);
      toast({ title: "Error Loading Community Posts", description: (error as Error).message + " Check server logs for more details from Supabase.", variant: "destructive" });
    } finally {
      setIsLoadingUserPosts(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContent();
    loadUserPosts();
  }, [loadContent, loadUserPosts]);

  const nextSlide = useCallback(() => {
    if (activeHeroSlides.length > 0) {
      setCurrentSlide((prev) => (prev === activeHeroSlides.length - 1 ? 0 : prev + 1));
    }
  }, [activeHeroSlides.length]);

  const prevSlide = () => {
     if (activeHeroSlides.length > 0) {
      setCurrentSlide((prev) => (prev === 0 ? activeHeroSlides.length - 1 : prev - 1));
    }
  };

  const goToSlide = (index: number) => {
    if (activeHeroSlides.length > 0) {
        setCurrentSlide(index % activeHeroSlides.length);
    }
  };

  useEffect(() => {
    if (activeHeroSlides.length > 1) {
      const slideInterval = setInterval(nextSlide, 7000); 
      return () => clearInterval(slideInterval);
    }
  }, [activeHeroSlides.length, nextSlide]);

  if (isLoadingContent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
         <div className="flex flex-col items-center">
            <Icons.Logo className="h-20 w-20 text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading Peak Pulse...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section with Carousel */}
      <section style={{ backgroundColor: 'black' }} className="relative h-screen w-full overflow-hidden">
        {activeHeroSlides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0 z-0 pointer-events-none"> 
              {slide.videoId ? (
                <>
                  <iframe
                    className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2"
                    src={`https://www.youtube.com/embed/${slide.videoId}?autoplay=1&mute=1&loop=1&playlist=${slide.videoId}&controls=0&showinfo=0&autohide=1&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title="Peak Pulse Background Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={false}
                  />
                  <div className="absolute inset-0 bg-black/30 z-[1]" /> 
                </>
              ) : slide.imageUrl ? (
                <>
                  <Image
                    src={slide.imageUrl}
                    alt={slide.altText || "Peak Pulse Hero Background"}
                    fill
                    sizes="100vw"
                    className="absolute inset-0 w-full h-full object-cover"
                    priority={index === 0} 
                    data-ai-hint={slide.dataAiHint || "fashion background"}
                  />
                  <div className="absolute inset-0 bg-black/30 z-[1]" /> 
                </>
              ) : null}
            </div>
            {index === currentSlide && (
                <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[calc(theme(spacing.20)_+_theme(spacing.6))] pb-12 px-6 md:px-8 text-center text-white max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                    {slide.title}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-neutral-200 mb-10 max-w-2xl mx-auto">
                    {slide.description}
                </p>
                {slide.ctaText && slide.ctaLink && (
                    <Button size="lg" asChild className="text-base md:text-lg py-3 px-8">
                    <Link href={slide.ctaLink}>
                        {slide.ctaText} <ShoppingBag className="ml-2 h-5 w-5" />
                    </Link>
                    </Button>
                )}
                </div>
            )}
          </div>
        ))}
        
        {activeHeroSlides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/25 text-white/80 hover:bg-black/50 hover:text-white focus-visible:bg-black/50 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-200 flex items-center justify-center"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/25 text-white/80 hover:bg-black/50 hover:text-white focus-visible:bg-black/50 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-200 flex items-center justify-center"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
            </Button>
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3 items-center bg-black/20 p-1.5 rounded-full backdrop-blur-sm">
              {activeHeroSlides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:bg-white/90 
                    ${currentSlide === index ? 'bg-white scale-125 ring-2 ring-white/30 ring-offset-1 ring-offset-transparent p-1 w-5 md:w-6' : 'bg-white/40 hover:bg-white/70'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Featured Collection Section */}
      <section className="section-padding container-wide relative z-[1] bg-background">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockFeaturedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild className="text-base">
            <Link href="/products">View All Products <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Brand Story Snippet / Artisanal Roots Section */}
      <section className="bg-card section-padding relative z-[1]">
        <div className="container-slim text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">{content.artisanalRoots?.title || "Our Artisanal Roots"}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{content.artisanalRoots?.description || "Details about our craftsmanship are currently loading."}</p>
          <Button variant="default" size="lg" asChild className="text-base">
            <Link href="/our-story">Discover Our Story <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Social Commerce Section (#PeakPulseStyle) */}
      <section className="section-padding container-wide relative z-[1] bg-background">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            #PeakPulseStyle <Instagram className="inline-block ml-2 h-7 w-7 text-pink-500" />
          </h2>
        {content.socialCommerceItems && content.socialCommerceItems.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.socialCommerceItems.map((item) => (
              <Link
                key={item.id}
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-muted rounded-lg overflow-hidden group relative shadow-md hover:shadow-xl transition-shadow"
              >
                <AspectRatio ratio={1/1} className="bg-background">
                  <Image
                    src={item.imageUrl || `https://placehold.co/400x400.png?text=Post`}
                    alt={item.altText || `User generated content showcasing Peak Pulse style`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={item.dataAiHint || "instagram fashion user"}
                  />
                </AspectRatio>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-2">
                  <Instagram className="h-8 w-8 mb-1" />
                  <span className="text-xs font-medium text-center">View on Instagram</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
            <p className="text-center text-muted-foreground">Follow us on Instagram to see our latest styles! Posts managed by admin will appear here.</p>
        )}
          <div className="text-center mt-12">
            <Button 
                variant="outline" 
                asChild
                className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:bg-pink-100 dark:hover:bg-pink-500/20 hover:text-pink-600 dark:hover:text-pink-400 border-pink-300 dark:border-pink-500/50 text-pink-600 dark:text-pink-400"
            >
              <Link href="https://instagram.com/peakpulsenp" target="_blank" rel="noopener noreferrer">
                Follow us on Instagram <Instagram className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

      {/* New User Posts Section */}
      <section className="section-padding container-wide relative z-[1] bg-muted/30">
        <div className="text-center mb-12">
            <Users className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-foreground">Community Spotlights</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">See how our community styles Peak Pulse. Share your look!</p>
        </div>
        {isLoadingUserPosts ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
        ) : userPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userPosts.map(post => (
              <Card key={post.id} className="overflow-hidden shadow-lg group">
                <AspectRatio ratio={1/1} className="bg-background">
                  <Image 
                    src={post.image_url} 
                    alt={post.caption || `Peak Pulse style by ${post.user_name}`} 
                    fill 
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform"
                    data-ai-hint="community fashion style"
                  />
                </AspectRatio>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <Image src={post.user_avatar_url || 'https://placehold.co/40x40.png'} alt={post.user_name || 'User'} width={32} height={32} className="rounded-full mr-2" data-ai-hint="user avatar community"/>
                    <span className="text-sm font-semibold text-foreground truncate">{post.user_name || 'Peak Pulse Fan'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate h-10">{post.caption || "Loving my Peak Pulse gear!"}</p>
                  {post.product_tags && post.product_tags.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-primary">Wearing: </span>
                      <span className="text-xs text-muted-foreground">{post.product_tags.join(', ')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No community posts yet. Be the first to share your style!</p>
        )}
        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link href="/community/create-post">
              <ImagePlus className="mr-2 h-5 w-5" /> Share Your Style
            </Link>
          </Button>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className="bg-card section-padding relative z-[1]">
        <div className="container-slim text-center">
          <Send className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4 text-foreground">Join the Peak Pulse Community</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Be the first to know about new arrivals, exclusive collections, and special events.
          </p>
          <NewsletterSignupForm />
        </div>
      </section>
    </>
  );
}
