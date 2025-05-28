
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { Icons } from '@/components/icons';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Instagram, Send, Users, ImagePlus, Loader2, Play, Pause, LayoutGrid, Palette as PaletteIcon, Handshake, ArrowUpDown } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import type { HomepageContent, Product, HeroSlide, UserPost, AdminCategory as CategoryType, DesignCollaborationGallery } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { InteractiveExternalLink } from '@/components/interactive-external-link';
import MainLayout from '@/components/layout/main-layout';
import { formatDisplayDate } from '@/lib/dateUtils';

const fallbackHeroSlide: HeroSlide = {
  id: 'fallback-hero-main-public',
  title: "Peak Pulse",
  description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Default content)",
  imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080&q=80",
  altText: "Default Peak Pulse Hero Image",
  dataAiHint: "fashion abstract modern",
  ctaText: "Explore Collections",
  ctaLink: "/products",
  videoId: undefined,
};

const defaultHomepageContent: HomepageContent = {
  heroSlides: [fallbackHeroSlide],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Default description about craftsmanship."
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

async function getHomepageApiContent(): Promise<HomepageContent> {
  const fetchUrl = `/api/content/homepage`;
  console.log(`[Client Fetch] Attempting to fetch from: ${fetchUrl}`);
  try {
    const res = await fetch(fetchUrl, { cache: 'no-store' });

    if (!res.ok) {
      let errorBody = `Failed to fetch homepage content. Status: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.message) errorBody += ` API Message: ${errorData.message}`;
        if (errorData.rawSupabaseError?.message) errorBody += ` Supabase Error: ${errorData.rawSupabaseError.message}`;
      } catch (e) { /* ignore if not json */ }
      console.error(errorBody);
      return {
        ...defaultHomepageContent,
        error: errorBody
      };
    }
    const jsonData = await res.json() as Partial<HomepageContent>;
    console.log("[Client Fetch] Successfully fetched homepage content:", jsonData);
    
    const processedHeroSlides = (Array.isArray(jsonData.heroSlides) && jsonData.heroSlides.length > 0)
      ? jsonData.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
          id: slide.id || `hs-client-${Date.now()}-${index}`,
          title: slide.title || fallbackHeroSlide.title,
          description: slide.description || fallbackHeroSlide.description,
          imageUrl: slide.imageUrl || undefined,
          videoId: slide.videoId === null ? undefined : slide.videoId,
          altText: slide.altText || fallbackHeroSlide.altText,
          dataAiHint: slide.dataAiHint || fallbackHeroSlide.dataAiHint,
          ctaText: slide.ctaText || fallbackHeroSlide.ctaText,
          ctaLink: slide.ctaLink || fallbackHeroSlide.ctaLink,
        }))
      : [fallbackHeroSlide];
    
    const result: HomepageContent = {
      heroSlides: processedHeroSlides,
      artisanalRoots: (jsonData.artisanalRoots && jsonData.artisanalRoots.title && jsonData.artisanalRoots.description)
        ? jsonData.artisanalRoots
        : defaultHomepageContent.artisanalRoots!,
      socialCommerceItems: (Array.isArray(jsonData.socialCommerceItems))
        ? jsonData.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({
            id: item.id || `social-client-${Date.now()}-${index}`,
            imageUrl: item.imageUrl || "https://placehold.co/400x400.png",
            linkUrl: item.linkUrl || "#",
            altText: item.altText || "Social media post",
            dataAiHint: item.dataAiHint || "social fashion",
            displayOrder: Number(item.displayOrder) || 0,
        }))
        : defaultHomepageContent.socialCommerceItems!,
      heroVideoId: jsonData.heroVideoId === null ? undefined : jsonData.heroVideoId,
      heroImageUrl: jsonData.heroImageUrl === null ? undefined : jsonData.heroImageUrl,
    };
    console.log("[Client Fetch] Processed content to be set:", result);
    return result;
  } catch (error) {
    console.error('[Client Fetch] CRITICAL ERROR in getHomepageApiContent:', error);
    return { ...defaultHomepageContent, error: (error as Error).message };
  }
}

async function getCategoriesForHomepage(): Promise<CategoryType[]> {
  try {
    const res = await fetch('/api/categories', { cache: 'no-store' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to fetch categories: ${res.statusText}`);
    }
    const categories: CategoryType[] = await res.json();
    // API now sorts by displayOrder, then name.
    return categories;
  } catch (error) {
    console.error("Error fetching categories for homepage:", error);
    return [];
  }
}

async function getDynamicFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await fetch('/api/products', { cache: 'no-store' });
    if (!response.ok) {
      let errorDetail = `Failed to fetch products: ${response.status} "${response.statusText || 'Unknown error'}"`;
       try {
          const errorData = await response.json();
          errorDetail = errorData.message || errorData.error || errorDetail;
          if (errorData.rawSupabaseError) {
            errorDetail += ` Supabase: ${errorData.rawSupabaseError.message || ''} ${errorData.rawSupabaseError.hint || ''}`;
          }
        } catch (e) { /* ignore if not json */ }
      console.error("[Client Fetch] getDynamicFeaturedProducts error:", errorDetail);
      throw new Error(`Failed to fetch products for featured section: ${errorDetail}`);
    }
    const allProducts: Product[] = await response.json();
    // Products are already sorted by createdAt descending from API
    const featured = allProducts.filter(p => p.isFeatured === true).slice(0, 3);
    return featured;
  } catch (error) {
    console.error("Error fetching dynamic featured products:", error);
    throw error; 
  }
}

async function getFeaturedCollaborations(): Promise<DesignCollaborationGallery[]> {
  try {
    const response = await fetch('/api/design-collaborations', { cache: 'no-store' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to fetch collaborations: ${response.statusText}`);
    }
    const allCollaborations: DesignCollaborationGallery[] = await response.json();
    return allCollaborations.slice(0, 3);
  } catch (error) {
    console.error("Error fetching featured collaborations:", error);
    return [];
  }
}

async function getApprovedUserPosts(): Promise<UserPost[]> {
  try {
    const response = await fetch('/api/user-posts', { cache: 'no-store' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch user posts');
    }
    const posts: UserPost[] = await response.json();
    return posts.slice(0, 4); // Display up to 4 user posts
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}


function HomePageContent() {
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [featuredCollaborations, setFeaturedCollaborations] = useState<DesignCollaborationGallery[]>([]);
  const [isLoadingCollaborations, setIsLoadingCollaborations] = useState(true);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(true);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const { toast } = useToast();
  
  const activeHeroSlides = content.heroSlides?.length ? content.heroSlides : [fallbackHeroSlide];

  const loadPageData = useCallback(async () => {
    setIsLoadingContent(true);
    setIsLoadingProducts(true);
    setIsLoadingCategories(true);
    setIsLoadingUserPosts(true);
    setIsLoadingCollaborations(true);

    try {
      const [
        fetchedContent, 
        fetchedCategories, 
        fetchedFeatured, 
        fetchedUserPosts,
        fetchedCollabs
      ] = await Promise.all([
        getHomepageApiContent(),
        getCategoriesForHomepage().catch(err => {
          toast({ title: "Error Loading Categories", description: err.message, variant: "destructive" });
          return [];
        }),
        getDynamicFeaturedProducts().catch(err => { 
          toast({ title: "Error Loading Featured Products", description: err.message, variant: "destructive" });
          return [];
        }),
        getApprovedUserPosts().catch(err => {
          toast({ title: "Error Loading User Posts", description: err.message, variant: "destructive" });
          return [];
        }),
        getFeaturedCollaborations().catch(err => {
          toast({ title: "Error Loading Collaborations", description: err.message, variant: "destructive"});
          return [];
        })
      ]);
      
      setContent(fetchedContent);
      setCategories(fetchedCategories);
      setFeaturedProducts(fetchedFeatured);
      setUserPosts(fetchedUserPosts);
      setFeaturedCollaborations(fetchedCollabs);

      if (fetchedContent.error && fetchedContent.error !== "Database client not configured.") { // Don't toast for DB client not ready during initial load
        toast({
          title: "Homepage Content Issue",
          description: fetchedContent.error,
          variant: "default" 
        });
      }
    } catch (error) {
      toast({
        title: "Error Loading Homepage Data",
        description: (error as Error).message || "Could not load all homepage data.",
        variant: "destructive"
      });
      setContent(defaultHomepageContent); // Ensure content is always set
    } finally {
      setIsLoadingContent(false);
      setIsLoadingProducts(false);
      setIsLoadingCategories(false);
      setIsLoadingUserPosts(false);
      setIsLoadingCollaborations(false);
    }
  }, [toast]);


  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

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

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  useEffect(() => {
    let slideInterval: NodeJS.Timeout | undefined;
    if (isPlaying && activeHeroSlides.length > 1) {
      slideInterval = setInterval(nextSlide, 7000); 
    }
    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [isPlaying, nextSlide, activeHeroSlides.length]);


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
  
  const currentHeroSlide = activeHeroSlides[currentSlide];
  const heroVideoId = currentHeroSlide?.videoId || content.heroVideoId;
  const heroImageUrl = currentHeroSlide?.imageUrl || content.heroImageUrl;

  return (
    <>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'black' }} className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
            {heroVideoId ? (
            <>
                <iframe
                className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2"
                src={`https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${heroVideoId}&controls=0&showinfo=0&autohide=1&modestbranding=1&playsinline=1&enablejsapi=1`}
                title={currentHeroSlide?.altText || "Peak Pulse Background Video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={false}
                />
                <div className="absolute inset-0 bg-black/30 z-[1]" />
            </>
            ) : heroImageUrl ? (
            <>
                <Image
                src={heroImageUrl}
                alt={currentHeroSlide?.altText || "Peak Pulse Hero Background"}
                fill
                sizes="100vw"
                priority
                className="absolute inset-0 w-full h-full object-cover"
                data-ai-hint={currentHeroSlide?.dataAiHint || "fashion mountains nepal"}
                />
                <div className="absolute inset-0 bg-black/30 z-[1]" />
            </>
            ) : (
              <div className="absolute inset-0 bg-black" /> // Ultimate black fallback
            )}
        </div>

        {activeHeroSlides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {index === currentSlide && (
                <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[calc(theme(spacing.20)_+_theme(spacing.6))] pb-12 px-6 md:px-8 text-center text-white max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-shadow-lg">
                    {slide.title}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-neutral-200 mb-10 max-w-2xl mx-auto text-shadow-md">
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
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 bg-black/20 p-1.5 rounded-full backdrop-blur-sm">
               <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="h-7 w-7 text-white/70 hover:text-white p-1"
                aria-label={isPlaying ? "Pause slides" : "Play slides"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              {activeHeroSlides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:bg-white/90 
                    ${currentSlide === index ? 'bg-white scale-125 ring-2 ring-white/30 ring-offset-1 ring-offset-transparent p-0.5 w-5 md:w-6' : 'bg-white/40 hover:bg-white/70'}`}
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
        {isLoadingProducts ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No featured products available. Check back soon or mark some products as featured in the admin panel!</p>
        )}
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
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{content.artisanalRoots?.description || "Details loading..."}</p>
          <Button variant="default" size="lg" asChild className="text-base">
            <Link href="/our-story">Discover Our Story <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      {isLoadingCategories ? (
         <section className="section-padding container-wide relative z-[1] bg-background"> <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></section>
      ) : categories && categories.length > 0 && (
        <section className="section-padding container-wide relative z-[1] bg-background">
          <div className="text-center mb-12">
            <LayoutGrid className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-foreground">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {categories.slice(0, 4).map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug}`} passHref legacyBehavior>
                <a className="block group">
                  <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full">
                    <AspectRatio ratio={1/1} className="relative bg-muted">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name || 'Category image'}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={category.aiImagePrompt || category.name.toLowerCase()}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <LayoutGrid className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight text-shadow-lg group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                      </div>
                    </AspectRatio>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
          {categories.length > 4 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" asChild className="text-base">
                <Link href="/categories">View All Categories <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Featured Collaborations Section */}
      {isLoadingCollaborations ? (
         <section className="section-padding container-wide relative z-[1] bg-muted/30"><div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></section>
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
                    {collab.cover_image_url ? (
                       <Image
                          src={collab.cover_image_url}
                          alt={collab.title || 'Collaboration cover image'}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          data-ai-hint={collab.ai_cover_image_prompt || collab.title.toLowerCase() || 'design art gallery'}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-secondary/10">
                          <PaletteIcon className="w-16 h-16 text-accent/30" />
                        </div>
                    )}
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
            <Button variant="outline" size="lg" asChild className="text-base">
              <Link href="/collaborations">View All Collaborations <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      )}


      {/* Social Commerce Section (#PeakPulseStyle) */}
      <section className="section-padding container-wide relative z-[1] bg-card">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            #PeakPulseStyle <Instagram className="inline-block ml-2 h-7 w-7 text-pink-500" />
          </h2>
        {content.socialCommerceItems && content.socialCommerceItems.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.socialCommerceItems.map((item) => (
               <InteractiveExternalLink
                key={item.id}
                href={item.linkUrl}
                className="block bg-muted rounded-lg overflow-hidden group relative shadow-md hover:shadow-xl transition-shadow"
                showDialog={true}
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
              </InteractiveExternalLink>
            ))}
          </div>
        ) : (
            <p className="text-center text-muted-foreground">Follow us on Instagram to see our latest styles! Posts managed by admin will appear here.</p>
        )}
          <div className="text-center mt-12">
            <InteractiveExternalLink href="https://instagram.com/peakpulsenp" showDialog={true}>
                <Button 
                    variant="outline" 
                    className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:bg-pink-100 dark:hover:bg-pink-500/20 hover:text-pink-600 dark:hover:text-pink-400 border-pink-300 dark:border-pink-500/50 text-pink-600 dark:text-pink-400"
                >
                Follow us on Instagram <Instagram className="ml-2 h-4 w-4" />
                </Button>
            </InteractiveExternalLink>
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


export default function RootPage() {
  return (
    <MainLayout>
      <HomePageContent />
    </MainLayout>
  );
}
