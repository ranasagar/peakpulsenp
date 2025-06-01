// src/app/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Instagram, Send, Users, ImagePlus, Loader2, Play, Pause, LayoutGrid, Palette as PaletteIcon, Handshake, Sprout } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import type { HomepageContent, Product, HeroSlide, UserPost, AdminCategory as CategoryType, DesignCollaborationGallery, ArtisanalRootsSlide, SocialCommerceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { InteractiveExternalLink } from '@/components/interactive-external-link';
import MainLayout from '@/components/layout/main-layout';
import { formatDisplayDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/product/product-card';


const fallbackHeroSlide: HeroSlide = {
  id: 'fallback-hero-main-public-page-ts',
  title: "Peak Pulse (Fallback)",
  description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Content failed to load, displaying fallback)",
  imageUrl: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080&q=80",
  altText: "Fallback Peak Pulse Hero Image",
  dataAiHint: "fashion model fallback",
  ctaText: "Explore Our Collections",
  ctaLink: "/products",
  videoId: undefined,
};

const defaultHomepageContent: HomepageContent = {
  heroSlides: [fallbackHeroSlide],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Default description about craftsmanship.",
    slides: [],
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};


async function getHomepageContent(): Promise<HomepageContent> {
  const fetchUrl = `/api/content/homepage`;
  console.log(`[Client Fetch] Attempting to fetch from: ${fetchUrl}`);
  try {
    const res = await fetch(fetchUrl, { cache: 'no-store' });

    if (!res.ok) {
      let errorDetail = `Failed to fetch homepage content. Status: ${res.status} ${res.statusText || '(No status text)'}`;
      let rawBodyForLog = "";
      let errorData = null;
      try {
        rawBodyForLog = await res.text();
        errorData = JSON.parse(rawBodyForLog);
        if (errorData && (errorData.error || errorData.message || errorData.rawSupabaseError)) {
          errorDetail = errorData.error || errorData.message || errorData.rawSupabaseError?.message || errorDetail;
          if (errorData.rawSupabaseError) {
            errorDetail += ` Supabase Error: ${errorData.rawSupabaseError.message || ''} Code: ${errorData.rawSupabaseError.code || ''}`;
          }
        }
      } catch (e) {
         console.warn("[Client Fetch] API error response was not valid JSON for homepage content. Raw body (first 200 chars):", rawBodyForLog.substring(0, 200));
         errorDetail += ` (Server response was not valid JSON. Raw: ${rawBodyForLog.substring(0,100)})`
      }
      console.error("[Client Fetch] Error fetching homepage content from API:", errorDetail, "Raw response status:", res.status, res.statusText);
      return { ...defaultHomepageContent, error: errorDetail };
    }

    const jsonData: HomepageContent = await res.json();
    console.log("[Client Fetch] Successfully fetched homepage content:", jsonData);
    
    const processedData: HomepageContent = {
      heroSlides: Array.isArray(jsonData.heroSlides) && jsonData.heroSlides.length > 0 
        ? jsonData.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({ ...fallbackHeroSlide, ...slide, id: slide.id || `hs-fetched-${Date.now()}-${index}` }))
        : defaultHomepageContent.heroSlides, 
      artisanalRoots: {
        title: jsonData.artisanalRoots?.title || defaultHomepageContent.artisanalRoots!.title,
        description: jsonData.artisanalRoots?.description || defaultHomepageContent.artisanalRoots!.description,
        slides: Array.isArray(jsonData.artisanalRoots?.slides) 
          ? jsonData.artisanalRoots.slides.map((slide: Partial<ArtisanalRootsSlide>, index: number) => ({ id: slide.id || `ars-fetched-${Date.now()}-${index}`, imageUrl: slide.imageUrl || '', altText: slide.altText || '', dataAiHint: slide.dataAiHint || '' })) 
          : defaultHomepageContent.artisanalRoots!.slides || [],
      },
      socialCommerceItems: Array.isArray(jsonData.socialCommerceItems) 
        ? jsonData.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({ id: item.id || `scs-fetched-${Date.now()}-${index}`, imageUrl: item.imageUrl || '', linkUrl: item.linkUrl || '#', altText: item.altText || '', dataAiHint: item.dataAiHint || '', displayOrder: item.displayOrder || 0}))
        : defaultHomepageContent.socialCommerceItems || [],
      heroVideoId: jsonData.heroVideoId === null ? undefined : jsonData.heroVideoId,
      heroImageUrl: jsonData.heroImageUrl === null ? undefined : jsonData.heroImageUrl,
    };
    return processedData;
  } catch (error: any) {
    console.error('[Client Fetch] CRITICAL NETWORK/FETCH ERROR in getHomepageContent:', error.name, error.message, error.stack);
    return { ...defaultHomepageContent, error: `Network error: ${error.message || 'Failed to connect to content API.'}` };
  }
}

function HomePageContent() {
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeaturedProducts, setIsLoadingFeaturedProducts] = useState(true);
  
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(true);

  const [featuredCollaborations, setFeaturedCollaborations] = useState<DesignCollaborationGallery[]>([]);
  const [isLoadingCollaborations, setIsLoadingCollaborations] = useState(true);

  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isHeroPlaying, setIsHeroPlaying] = useState(true);

  const [currentArtisanalSlide, setCurrentArtisanalSlide] = useState(0);
  const [isArtisanalPlaying, setIsArtisanalPlaying] = useState(true);

  const [currentSocialCommerceSlide, setCurrentSocialCommerceSlide] = useState(0);

  const { toast } = useToast();

  const loadPageData = useCallback(async () => {
    setIsLoadingContent(true);
    setIsLoadingFeaturedProducts(true);
    setIsLoadingCategories(true);
    setIsLoadingUserPosts(true);
    setIsLoadingCollaborations(true);
    
    const fetchedContent = await getHomepageContent();
    setContent(current => ({...current, ...fetchedContent, heroSlides: fetchedContent.heroSlides || current.heroSlides }));
    if (fetchedContent.error) {
      toast({
        title: "Error Loading Homepage Content",
        description: `${fetchedContent.error}. Using default values.`,
        variant: "destructive",
        duration: 7000,
      });
    }
    setIsLoadingContent(false);

    try {
      const productsResponse = await fetch('/api/products');
      if (!productsResponse.ok) {
        let errorDetail = 'Failed to fetch products for featured section';
        try { 
            const errorData = await productsResponse.json(); 
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `${productsResponse.status} ${productsResponse.statusText}`; 
        } catch (e) {
            const textError = await productsResponse.text();
            errorDetail = `${productsResponse.status}: ${textError.substring(0,100) || productsResponse.statusText}`;
        }
        throw new Error(errorDetail);
      }
      const allProducts: Product[] = await productsResponse.json();
      const featured = allProducts.filter(p => p.isFeatured).slice(0, 3);
      setFeaturedProducts(featured);
    } catch (err) {
      toast({ title: "Error Loading Featured Products", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingFeaturedProducts(false);
    }

    try {
      const categoriesResponse = await fetch('/api/categories');
      if (!categoriesResponse.ok) {
        let errorDetail = 'Failed to fetch categories';
        try { const errorData = await categoriesResponse.json(); errorDetail = errorData.message || errorData.rawSupabaseError?.message || `${categoriesResponse.status} ${categoriesResponse.statusText}`; } catch (e) {/* ignore */}
        throw new Error(errorDetail);
      }
      const categoriesData: CategoryType[] = await categoriesResponse.json();
      setCategories(categoriesData);
    } catch (err) {
      toast({ title: "Error Loading Categories", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingCategories(false);
    }
    
    try {
        const userPostsResponse = await fetch('/api/user-posts');
        if(!userPostsResponse.ok) {
            let errorDetail = `Failed to fetch user posts. Status: ${userPostsResponse.status}`;
            try {
                const errorData = await userPostsResponse.json();
                errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server error: ${userPostsResponse.statusText}`;
            } catch(e) {/* ignore */}
            throw new Error(errorDetail);
        }
        const postsData: UserPost[] = await userPostsResponse.json();
        setUserPosts(postsData.slice(0,4));
    } catch (err) {
        toast({ title: "Error Loading User Posts", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsLoadingUserPosts(false);
    }

    try {
      const collabsResponse = await fetch('/api/design-collaborations');
      if (!collabsResponse.ok) {
        let errorDetail = 'Failed to fetch collaborations';
        try { const errorData = await collabsResponse.json(); errorDetail = errorData.message || errorData.rawSupabaseError?.message || `${collabsResponse.status} ${collabsResponse.statusText}`; } catch (e) {/* ignore */}
        throw new Error(errorDetail);
      }
      const collabsData: DesignCollaborationGallery[] = await collabsResponse.json();
      setFeaturedCollaborations(collabsData.slice(0,3));
    } catch(err) {
      toast({ title: "Error Loading Collaborations", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingCollaborations(false);
    }

  }, [toast]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);
  
  const activeHeroSlides = content.heroSlides && content.heroSlides.length > 0 ? content.heroSlides : [fallbackHeroSlide];
  const activeArtisanalSlides = content.artisanalRoots?.slides && content.artisanalRoots.slides.length > 0 ? content.artisanalRoots.slides : [];


  const nextHeroSlide = useCallback(() => {
    if (activeHeroSlides.length > 0) {
      setCurrentHeroSlide((prev) => (prev === activeHeroSlides.length - 1 ? 0 : prev + 1));
    }
  }, [activeHeroSlides.length]);

  const prevHeroSlide = () => {
     if (activeHeroSlides.length > 0) {
      setCurrentHeroSlide((prev) => (prev === 0 ? activeHeroSlides.length - 1 : prev - 1));
    }
  };
  const goToHeroSlide = (index: number) => {
    if (activeHeroSlides.length > 0) { setCurrentHeroSlide(index % activeHeroSlides.length); }
  };
  const toggleHeroPlayPause = () => setIsHeroPlaying(prev => !prev);

  useEffect(() => {
    let slideInterval: NodeJS.Timeout | undefined;
    if (isHeroPlaying && activeHeroSlides.length > 1) {
      slideInterval = setInterval(nextHeroSlide, 7000); 
    }
    return () => { if (slideInterval) { clearInterval(slideInterval); } };
  }, [isHeroPlaying, nextHeroSlide, activeHeroSlides.length]);
  
  const nextArtisanalSlide = useCallback(() => {
    if (activeArtisanalSlides.length > 0) {
      setCurrentArtisanalSlide((prev) => (prev === activeArtisanalSlides.length - 1 ? 0 : prev + 1));
    }
  }, [activeArtisanalSlides.length]);

  useEffect(() => {
    let artisanalSlideInterval: NodeJS.Timeout | undefined;
    if (isArtisanalPlaying && activeArtisanalSlides.length > 1) { 
      artisanalSlideInterval = setInterval(nextArtisanalSlide, 5000); 
    }
    return () => {
      if (artisanalSlideInterval) {
        clearInterval(artisanalSlideInterval);
      }
    };
  }, [isArtisanalPlaying, nextArtisanalSlide, activeArtisanalSlides.length]);
  
  const activeSocialCommerceItems = content.socialCommerceItems || [];

  const nextSocialCommerceSlide = useCallback(() => {
    if (activeSocialCommerceItems.length > 0) {
      setCurrentSocialCommerceSlide(prev => (prev === activeSocialCommerceItems.length - 1 ? 0 : prev + 1));
    }
  }, [activeSocialCommerceItems.length]);

  const prevSocialCommerceSlide = useCallback(() => {
    if (activeSocialCommerceItems.length > 0) {
      setCurrentSocialCommerceSlide(prev => (prev === 0 ? activeSocialCommerceItems.length - 1 : prev - 1));
    }
  }, [activeSocialCommerceItems.length]);

  const goToSocialCommerceSlide = (index: number) => {
    if (activeSocialCommerceItems.length > 0) {
      setCurrentSocialCommerceSlide(index % activeSocialCommerceItems.length);
    }
  };

  if (isLoadingContent && isLoadingFeaturedProducts && isLoadingCategories && isLoadingUserPosts && isLoadingCollaborations) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center">
                <Icons.Logo className="h-20 w-20 text-primary animate-pulse mb-4" />
                <p className="text-muted-foreground">Loading Peak Pulse...</p>
            </div>
        </div>
    );
  }
  
  const currentDisplayedHeroSlide = activeHeroSlides[currentHeroSlide];
  const heroVideoId = currentDisplayedHeroSlide?.videoId || content.heroVideoId; 
  const heroImageUrl = currentDisplayedHeroSlide?.imageUrl || content.heroImageUrl;


  return (
    <>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'black' }} className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {activeHeroSlides.map((slide, index) => (
            <div
              key={slide.id || `hero-bg-${index}`}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                index === currentHeroSlide ? "opacity-100" : "opacity-0"
              )}
            >
              {slide.videoId ? (
                <>
                  <iframe
                    className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2"
                    src={`https://www.youtube.com/embed/${slide.videoId}?autoplay=1&mute=1&loop=1&playlist=${slide.videoId}&controls=0&showinfo=0&autohide=1&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title={slide.altText || "Peak Pulse Background Video"}
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
                    priority={index === 0}
                    className="absolute inset-0 w-full h-full object-cover"
                    data-ai-hint={slide.dataAiHint || "fashion mountains nepal"}
                  />
                  <div className="absolute inset-0 bg-black/30 z-[1]" />
                </>
              ) : (
                 <div className="absolute inset-0 bg-black" /> 
              )}
            </div>
          ))}
           {activeHeroSlides.length === 0 && heroVideoId && (
             <>
                <iframe
                    className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2"
                    src={`https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${heroVideoId}&controls=0&showinfo=0&autohide=1&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title={"Peak Pulse Background Video"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={false}
                />
                <div className="absolute inset-0 bg-black/30 z-[1]" />
             </>
           )}
           {activeHeroSlides.length === 0 && !heroVideoId && heroImageUrl && (
                <>
                    <Image
                        src={heroImageUrl}
                        alt={"Peak Pulse Hero Background"}
                        fill
                        sizes="100vw"
                        priority
                        className="absolute inset-0 w-full h-full object-cover"
                        data-ai-hint={"fashion mountains nepal"}
                    />
                    <div className="absolute inset-0 bg-black/30 z-[1]" />
                </>
           )}
           {activeHeroSlides.length === 0 && !heroVideoId && !heroImageUrl && (
                <div className="absolute inset-0 bg-black" />
           )}
        </div>

        {activeHeroSlides.map((slide, index) => (
          <div
            key={slide.id || `hero-content-${index}`}
            className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                index === currentHeroSlide ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={{ pointerEvents: index === currentHeroSlide ? 'auto' : 'none' }}
          >
            <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[calc(theme(spacing.20)_+_theme(spacing.6))] pb-12 px-6 md:px-8 text-center text-white max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-shadow-lg">
                    {slide.title}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-neutral-200 mb-10 max-w-2xl mx-auto text-shadow-md">
                    {slide.description}
                </p>
                {slide.ctaText && slide.ctaLink && (
                    <Link href={slide.ctaLink} className={cn(buttonVariants({ size: "lg", className: "text-base md:text-lg py-3 px-8" }))}>
                        <span className="flex items-center">
                            {slide.ctaText} <ShoppingBag className="ml-2 h-5 w-5" />
                        </span>
                    </Link>
                )}
            </div>
          </div>
        ))}
        
        {activeHeroSlides.length > 1 && (
          <>
            <Button
              variant="ghost" size="icon"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/25 text-white/80 hover:bg-black/50 hover:text-white focus-visible:bg-black/50 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-200 flex items-center justify-center"
              onClick={prevHeroSlide} aria-label="Previous slide"
            > <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" /> </Button>
            <Button
              variant="ghost" size="icon"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/25 text-white/80 hover:bg-black/50 hover:text-white focus-visible:bg-black/50 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-200 flex items-center justify-center"
              onClick={nextHeroSlide} aria-label="Next slide"
            > <ChevronRight className="h-6 w-6 md:h-7 md:w-7" /> </Button>
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 bg-black/20 p-1.5 rounded-full backdrop-blur-sm">
               <Button variant="ghost" size="icon" onClick={toggleHeroPlayPause} className="h-7 w-7 text-white/70 hover:text-white p-1" aria-label={isHeroPlaying ? "Pause slides" : "Play slides"} >
                {isHeroPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} </Button>
              {activeHeroSlides.map((_, index) => (
                <button key={`dot-${index}`} onClick={() => goToHeroSlide(index)}
                  className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:bg-white/90 
                    ${currentHeroSlide === index ? 'bg-white scale-125 ring-2 ring-white/30 ring-offset-1 ring-offset-transparent p-0.5 w-5 md:w-6' : 'bg-white/40 hover:bg-white/70'}`}
                  aria-label={`Go to slide ${index + 1}`} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="section-padding container-wide relative z-[1] bg-background">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Collection</h2>
        {isLoadingFeaturedProducts ? (
          <div className="flex justify-center items-center py-10"> <Loader2 className="h-10 w-10 animate-spin text-primary" /> </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map(product => ( <ProductCard key={product.id} product={product} /> ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No featured products available at the moment. Check back soon!</p>
        )}
        <div className="text-center mt-12">
            <Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "text-base" }))}>
                View All Products <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
        </div>
      </section>

      <section className="bg-card section-padding relative z-[1] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
            {activeArtisanalSlides.map((slide, index) => (
                 <div
                    key={slide.id || `ars-bg-${index}`}
                    className={cn(
                        "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                        index === currentArtisanalSlide ? "opacity-100" : "opacity-0"
                    )}
                 >
                    <Image
                        src={slide.imageUrl}
                        alt={slide.altText || "Artisanal background"}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        data-ai-hint={slide.dataAiHint || "nepal craft texture"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/50 md:bg-gradient-to-r md:from-card md:via-card/70 md:to-transparent z-[1]"></div>
                 </div>
            ))}
            {activeArtisanalSlides.length === 0 && <div className="absolute inset-0 bg-primary/5"></div>}
        </div>
        <div className="container-slim text-center md:text-left relative z-10">
            <div className="md:w-1/2 lg:w-3/5">
                <Sprout className="h-10 w-10 text-primary mb-4 mx-auto md:mx-0"/>
                <h2 className="text-3xl font-bold mb-6 text-foreground">{content.artisanalRoots?.title || "Our Artisanal Roots"}</h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{content.artisanalRoots?.description || "Details loading..."}</p>
                <Link href="/our-story" className={cn(buttonVariants({ variant: "default", size: "lg", className: "text-base" }))}>
                    <span className="flex items-center">Discover Our Story <ArrowRight className="ml-2 h-5 w-5" /></span>
                </Link>
            </div>
        </div>
      </section>

      {isLoadingCategories ? ( <section className="section-padding container-wide relative z-[1] bg-background"> <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></section>
      ) : categories && categories.length > 0 && (
        <section className="section-padding container-wide relative z-[1] bg-background">
          <div className="text-center mb-12">
            <LayoutGrid className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-foreground">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {categories.slice(0, 4).map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug}`} className="block group">
                  <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full">
                    <AspectRatio ratio={1/1} className="relative bg-muted">
                      {category.imageUrl ? (
                        <Image src={category.imageUrl} alt={category.name || 'Category image'} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" data-ai-hint={category.aiImagePrompt || category.name.toLowerCase()} />
                      ) : ( <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10"> <LayoutGrid className="w-16 h-16 text-primary/30" /> </div> )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight text-shadow-lg group-hover:text-primary transition-colors"> {category.name} </h3>
                      </div>
                    </AspectRatio>
                  </Card>
              </Link>
            ))}
          </div>
          {categories.length > 4 && (
            <div className="text-center mt-12">
                <Link href="/categories" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "text-base" }))}>
                    View All Categories <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </div>
          )}
        </section>
      )}

      {isLoadingCollaborations ? ( <section className="section-padding container-wide relative z-[1] bg-muted/30"><div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></section>
      ): featuredCollaborations.length > 0 && (
        <section className="section-padding container-wide relative z-[1] bg-muted/30">
          <div className="text-center mb-12">
            <Handshake className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-foreground">Featured Collaborations</h2>
            <p className="text-muted-foreground mt-1 max-w-xl mx-auto">Discover unique artistic visions and creative partnerships.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCollaborations.map(collab => (
              <Link key={collab.id} href={`/collaborations/${collab.slug}`} className="block group">
                <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full flex flex-col">
                  <AspectRatio ratio={16/10} className="relative bg-background">
                    {collab.cover_image_url ? ( <Image src={collab.cover_image_url} alt={collab.title || 'Collaboration cover image'} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" data-ai-hint={collab.ai_cover_image_prompt || collab.title.toLowerCase() || 'design art gallery'} />
                    ) : ( <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-secondary/10"> <PaletteIcon className="w-16 h-16 text-accent/30" /> </div> )}
                  </AspectRatio>
                  <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">{collab.title}</h3>
                      {collab.artist_name && <p className="text-xs text-muted-foreground mb-1">By: {collab.artist_name}</p>}
                      {collab.collaboration_date && <p className="text-xs text-muted-foreground"> {formatDisplayDate(collab.collaboration_date)}</p>}
                    </div>
                    <span className="text-primary text-sm font-medium mt-2 self-start group-hover:underline">View Gallery &rarr;</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/collaborations" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "text-base" }))}>
                View All Collaborations <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Social Commerce Section (#PeakPulseStyle) */}
      <section className="section-padding container-wide relative z-[1] bg-card">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          #PeakPulseStyle <Instagram className="inline-block ml-2 h-7 w-7 text-pink-500" />
        </h2>
        {isLoadingContent ? (
          <div className="relative w-full max-w-xl mx-auto">
            <AspectRatio ratio={1/1} className="bg-muted rounded-xl shadow-lg animate-pulse" />
            <div className="flex justify-center mt-4 space-x-2">
              {Array(3).fill(0).map((_, i) => ( <div key={i} className="h-2.5 w-2.5 bg-muted rounded-full animate-pulse" /> ))}
            </div>
          </div>
        ) : activeSocialCommerceItems.length > 0 ? (
          <div className="relative w-full max-w-xl mx-auto">
            <div className="overflow-hidden rounded-xl shadow-2xl">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentSocialCommerceSlide * 100}%)` }}
              >
                {activeSocialCommerceItems.map((item) => (
                  <div key={item.id || item.imageUrl} className="min-w-full shrink-0">
                    <InteractiveExternalLink href={item.linkUrl} className="block group relative" showDialog={true}>
                      <AspectRatio ratio={1/1} className="bg-background">
                        <Image
                          src={item.imageUrl || `https://placehold.co/600x600.png?text=User+Post`}
                          alt={item.altText || `Peak Pulse style by a user`}
                          fill
                          sizes="(max-width: 768px) 100vw, 600px"
                          className="object-cover" 
                          data-ai-hint={item.dataAiHint || "instagram fashion user"}
                        />
                        {/* Enhanced Glass reflection overlay */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-all duration-500 ease-in-out
                                     bg-gradient-to-br from-white/50 via-white/25 to-transparent
                                     mix-blend-overlay group-hover:backdrop-blur-[2px] pointer-events-none"
                        ></div>
                        {/* Instagram icon overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4">
                          <Instagram className="h-10 w-10 mb-2" />
                          <span className="text-sm font-medium text-center">View on Instagram</span>
                        </div>
                      </AspectRatio>
                    </InteractiveExternalLink>
                  </div>
                ))}
              </div>
            </div>
            {activeSocialCommerceItems.length > 1 && (
              <>
                <Button
                  variant="outline" size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:-translate-x-full z-10 h-10 w-10 rounded-full bg-card/80 hover:bg-card shadow-md"
                  onClick={prevSocialCommerceSlide} aria-label="Previous Social Post"
                > <ChevronLeft className="h-5 w-5" /> </Button>
                <Button
                  variant="outline" size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:translate-x-full z-10 h-10 w-10 rounded-full bg-card/80 hover:bg-card shadow-md"
                  onClick={nextSocialCommerceSlide} aria-label="Next Social Post"
                > <ChevronRight className="h-5 w-5" /> </Button>
                <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 mt-4">
                  {activeSocialCommerceItems.map((_, index) => (
                    <button
                      key={`scs-dot-${index}`}
                      onClick={() => goToSocialCommerceSlide(index)}
                      className={cn(
                        "h-2.5 w-2.5 rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:bg-primary/70",
                        currentSocialCommerceSlide === index ? 'bg-primary scale-125' : 'bg-muted-foreground/40'
                      )}
                      aria-label={`Go to social post ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Follow us on Instagram! Posts shared by our community will appear here.</p>
        )}
        <div className="text-center mt-16">
            <InteractiveExternalLink href="https://instagram.com/peakpulsenp" showDialog={true}>
                <Button variant="outline" className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:bg-pink-100 dark:hover:bg-pink-500/20 hover:text-pink-600 dark:hover:text-pink-400 border-pink-300 dark:border-pink-500/50 text-pink-600 dark:text-pink-400" >
                    <span className="flex items-center">Follow us on Instagram <Instagram className="ml-2 h-4 w-4" /></span>
                </Button>
            </InteractiveExternalLink>
        </div>
      </section>

      <section className="section-padding container-wide relative z-[1] bg-muted/30">
        <div className="text-center mb-12">
            <Users className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-foreground">Community Spotlights</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">See how our community styles Peak Pulse. Share your look!</p>
        </div>
        {isLoadingUserPosts ? ( <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
        ) : userPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userPosts.map(post => (
              <Card key={post.id} className="overflow-hidden shadow-lg group">
                <AspectRatio ratio={1/1} className="bg-background">
                  <Image src={post.image_url} alt={post.caption || `Peak Pulse style by ${post.user_name}`} fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform" data-ai-hint="community fashion style" />
                </AspectRatio>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <Image src={post.user_avatar_url || 'https://placehold.co/40x40.png'} alt={post.user_name || 'User'} width={32} height={32} className="rounded-full mr-2" data-ai-hint="user avatar community"/>
                    <span className="text-sm font-semibold text-foreground truncate">{post.user_name || 'Peak Pulse Fan'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate h-10">{post.caption || "Loving my Peak Pulse gear!"}</p>
                  {post.product_tags && post.product_tags.length > 0 && ( <div className="mt-2"> <span className="text-xs font-medium text-primary">Wearing: </span> <span className="text-xs text-muted-foreground">{post.product_tags.join(', ')}</span> </div> )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ( <p className="text-center text-muted-foreground py-8">No community posts yet. Be the first to share your style!</p> )}
        <div className="text-center mt-12">
            <Link href="/community/create-post" className={cn(buttonVariants({ size: "lg"}))}>
                <span className="flex items-center"><ImagePlus className="mr-2 h-5 w-5" /> Share Your Style</span>
            </Link>
        </div>
      </section>

      <section className="bg-card section-padding relative z-[1]">
        <div className="container-slim text-center">
          <Send className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4 text-foreground">Join the Peak Pulse Community</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto"> Be the first to know about new arrivals, exclusive collections, and special events. </p>
          <NewsletterSignupForm />
        </div>
      </section>
    </>
  );
}

export default function RootPage() {
  return (
    <MainLayout>
      <HomePageContent />
    </MainLayout>
  );
}
