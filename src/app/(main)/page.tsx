
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { Icons } from '@/components/icons';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Instagram, Send } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import type { HomepageContent, Product, HeroSlide, SocialCommerceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Fallback content structure, mirrors HomepageContent type
const fallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-hero-default',
      title: "Peak Pulse (Loading...)",
      description: "Experience the fusion of ancient Nepali artistry and modern streetwear. Content may be loading or temporarily unavailable.",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1920&h=1080&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      altText: "Fallback hero image: abstract fashion",
      dataAiHint: "fashion abstract modern",
      ctaText: "Explore Collections",
      ctaLink: "/products",
      videoId: undefined,
    }
  ],
  artisanalRoots: {
    title: "Our Artisanal Roots (Loading...)",
    description: "Details about our craftsmanship are currently loading. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen."
  },
  socialCommerceItems: [],
};

async function getHomepageContent(): Promise<HomepageContent> {
  const fetchUrl = `/api/content/homepage`; // Always use relative path for client-side fetch to same origin
  console.log(`[Client Fetch] Attempting to fetch from: ${fetchUrl}`);
  try {
    const res = await fetch(fetchUrl, { cache: 'no-store' });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Could not read error body");
      console.error(`[Client Fetch] Failed to fetch content. Status: ${res.status} ${res.statusText}. Body:`, errorBody);
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("[Client Fetch] Successfully fetched content:", data);
    // Ensure data has the expected structure, using fallbacks if parts are missing
    const processedData: HomepageContent = {
      heroSlides: (Array.isArray(data.heroSlides) && data.heroSlides.length > 0)
        ? data.heroSlides.map((slide: Partial<HeroSlide>) => ({
            id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: slide.title || fallbackContent.heroSlides![0].title,
            description: slide.description || fallbackContent.heroSlides![0].description,
            imageUrl: slide.imageUrl,
            videoId: slide.videoId,
            altText: slide.altText || fallbackContent.heroSlides![0].altText,
            dataAiHint: slide.dataAiHint || fallbackContent.heroSlides![0].dataAiHint,
            ctaText: slide.ctaText || fallbackContent.heroSlides![0].ctaText,
            ctaLink: slide.ctaLink || fallbackContent.heroSlides![0].ctaLink,
          }))
        : fallbackContent.heroSlides,
      artisanalRoots: (data.artisanalRoots && data.artisanalRoots.title && data.artisanalRoots.description)
        ? data.artisanalRoots
        : fallbackContent.artisanalRoots,
      socialCommerceItems: (Array.isArray(data.socialCommerceItems))
        ? data.socialCommerceItems.map((item: Partial<SocialCommerceItem>) => ({
            id: item.id || `social-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            imageUrl: item.imageUrl || "https://placehold.co/400x400.png",
            linkUrl: item.linkUrl || "#",
            altText: item.altText || "Social post",
            dataAiHint: item.dataAiHint || "social fashion",
          }))
        : fallbackContent.socialCommerceItems,
    };
    console.log("[Client Fetch] Processed content to be set:", processedData);
    return processedData;
  } catch (error) {
    console.error("[Client Fetch] CRITICAL ERROR in getHomepageContent:", error);
    return fallbackContent; // Return fallback on any critical error
  }
}


// Mock products for "Featured Collection" - replace with actual data fetching later
const mockFeaturedProducts: Product[] = [
  { id: 'prod-1', name: 'Himalayan Breeze Jacket', slug: 'himalayan-breeze-jacket', price: 12000, images: [{ id: 'img-1', url: 'https://catalog-resize-images.thedoublef.com/606bc76216f1f9cb1ad8281eb9b7e84e/900/900/NF0A4QYXNY_P_NORTH-ZU31.a.jpg', altText: 'Himalayan Breeze Jacket', dataAiHint: 'jacket fashion' }], categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }], shortDescription: 'Lightweight and versatile for any adventure.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here." },
  { id: 'prod-2', name: 'Kathmandu Comfort Tee', slug: 'kathmandu-comfort-tee', price: 3500, images: [{ id: 'img-2', url: 'https://placehold.co/600x800.png?text=Tee', altText: 'Kathmandu Comfort Tee', dataAiHint: 'tee shirt' }], categories: [{ id: 'cat-2', name: 'Tops', slug: 'tops' }], shortDescription: 'Premium cotton for everyday luxury and style.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here." },
  { id: 'prod-3', name: 'Urban Nomad Pants', slug: 'urban-nomad-pants', price: 7500, images: [{ id: 'img-3', url: 'https://placehold.co/600x800.png?text=Pants', altText: 'Urban Nomad Pants', dataAiHint: 'pants fashion' }], categories: [{ id: 'cat-3', name: 'Bottoms', slug: 'bottoms' }], shortDescription: 'Street-ready style with traditional Nepali touches.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here." },
];


export default function HomePage() {
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [content, setContent] = useState<HomepageContent>(fallbackContent);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();

  const activeHeroSlides = content.heroSlides?.filter(slide => slide.title && (slide.imageUrl || slide.videoId)) || [];

  const loadContent = useCallback(async () => {
    setIsLoadingContent(true);
    try {
      const fetchedContent = await getHomepageContent();
      setContent(fetchedContent);
    } catch (error) {
      console.error("Error setting homepage content:", error);
      toast({
        title: "Content Load Error",
        description: (error as Error).message || "Could not load homepage content. Displaying defaults.",
        variant: "destructive"
      });
      setContent(fallbackContent); // Ensure fallback is set on error
    } finally {
      setIsLoadingContent(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === activeHeroSlides.length - 1 ? 0 : prev + 1));
  }, [activeHeroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeHeroSlides.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (activeHeroSlides.length > 1) {
      const slideInterval = setInterval(nextSlide, 7000); // Auto-slide every 7 seconds
      return () => clearInterval(slideInterval);
    }
  }, [activeHeroSlides.length, nextSlide]);

  if (isLoadingContent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.Logo className="h-20 w-20 text-primary animate-pulse" />
      </div>
    );
  }

  const heroTitle = activeHeroSlides[currentSlide]?.title || fallbackContent.heroSlides![0].title;
  const heroDescription = activeHeroSlides[currentSlide]?.description || fallbackContent.heroSlides![0].description;
  const heroVideoId = activeHeroSlides[currentSlide]?.videoId;
  const heroImageUrl = activeHeroSlides[currentSlide]?.imageUrl;
  const heroImageAlt = activeHeroSlides[currentSlide]?.altText || fallbackContent.heroSlides![0].altText;
  const heroDataAiHint = activeHeroSlides[currentSlide]?.dataAiHint || fallbackContent.heroSlides![0].dataAiHint;
  const heroCtaText = activeHeroSlides[currentSlide]?.ctaText || fallbackContent.heroSlides![0].ctaText;
  const heroCtaLink = activeHeroSlides[currentSlide]?.ctaLink || fallbackContent.heroSlides![0].ctaLink;
  
  const artisanalRootsTitle = content.artisanalRoots?.title || fallbackContent.artisanalRoots!.title;
  const artisanalRootsDescription = content.artisanalRoots?.description || fallbackContent.artisanalRoots!.description;
  const socialItems = content.socialCommerceItems || [];


  return (
    <>
      {/* Hero Section with Carousel */}
      <section style={{ backgroundColor: 'black' }} className="relative h-screen w-full overflow-hidden">
        {/* Background Media Container (Video or Image) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {activeHeroSlides.map((slide, index) => (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
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
                  <div className="absolute inset-0 bg-black/60 z-[1]" /> {/* Darker overlay for video */}
                </>
              ) : slide.imageUrl ? (
                <>
                  <Image
                    src={slide.imageUrl}
                    alt={slide.altText || "Peak Pulse Hero Background"}
                    layout="fill"
                    objectFit="cover"
                    priority={index === 0}
                    className="absolute inset-0 w-full h-full object-cover"
                    data-ai-hint={slide.dataAiHint || "fashion background"}
                  />
                  <div className="absolute inset-0 bg-black/60 z-[1]" /> {/* Darker overlay for image */}
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Text Content Overlay */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[calc(theme(spacing.20)_+_theme(spacing.6))] pb-12 px-6 md:px-8 text-center text-white max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-shadow-lg animate-fade-in-down">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-neutral-200 mb-10 max-w-2xl mx-auto text-shadow-md animate-fade-in-up">
            {heroDescription}
          </p>
          {heroCtaText && heroCtaLink && (
            <Button size="lg" asChild className="text-base md:text-lg py-3 px-8 animate-fade-in-up animation-delay-300">
              <Link href={heroCtaLink}>
                {heroCtaText} <ShoppingBag className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>

        {/* Carousel Navigation */}
        {activeHeroSlides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20 hover:text-white h-12 w-12 rounded-full"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20 hover:text-white h-12 w-12 rounded-full"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
              {activeHeroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    currentSlide === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                  }`}
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
          <h2 className="text-3xl font-bold mb-6 text-foreground">{artisanalRootsTitle}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{artisanalRootsDescription}</p>
          <Button variant="default" size="lg" asChild className="text-base">
            <Link href="/our-story">Discover Our Story <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Social Commerce Section (#PeakPulseStyle) */}
      {socialItems && socialItems.length > 0 && (
        <section className="section-padding container-wide relative z-[1] bg-background">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            #PeakPulseStyle <Instagram className="inline-block ml-2 h-7 w-7 text-pink-500" />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {socialItems.map((item) => (
              <Link
                key={item.id}
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-muted rounded-lg overflow-hidden group relative aspect-square"
              >
                <Image
                  src={item.imageUrl || `https://placehold.co/400x400.png?text=Post`}
                  alt={item.altText || `User generated content showcasing Peak Pulse style`}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={item.dataAiHint || "instagram fashion user"}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-2">
                  <Instagram className="h-8 w-8 mb-1" />
                  <span className="text-xs font-medium text-center">View on Instagram</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="secondary" asChild>
              <Link href="https://instagram.com/peakpulsenp" target="_blank" rel="noopener noreferrer">
                Follow us on Instagram <Instagram className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Newsletter Signup Section */}
      <section className="bg-primary/5 section-padding relative z-[1]">
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
