
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import type { Product, HeroSlide } from '@/types'; // Added HeroSlide
import { ArrowRight, Instagram, Send, ShoppingBag, ChevronLeft, ChevronRight as ChevronRightIcon, Dot } from 'lucide-react'; // Added Chevron icons and Dot
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import { AspectRatio } from '@/components/ui/aspect-ratio'; // Make sure AspectRatio is imported
import React, { useState, useEffect, useCallback } from 'react'; // Added React imports for carousel

interface HomepageContent {
  heroSlides?: HeroSlide[]; // Changed to heroSlides array
  artisanalRoots?: {
    title: string;
    description: string;
  };
}

// Fallback content if API fails or content is missing
const fallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-1',
      title: "Peak Pulse (Content Error)",
      description: "Timeless Nepali Craft, Modern Edge. (Fallback Content)",
      imageUrl: "https://images.unsplash.com/photo-1552668693-2be515a07459?q=80&w=1920&h=1080&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      altText: "Fallback hero image",
      dataAiHint: "nepal fashion mountains",
      ctaText: "Explore Collection",
      ctaLink: "/products"
    }
  ],
  artisanalRoots: {
    title: "Our Artisanal Roots (Error)",
    description: "Content failed to load. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen."
  }
};

async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const res = await fetch(`${baseUrl}/api/content/homepage`, { cache: 'no-store' });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Failed to fetch homepage content: ${res.status} ${res.statusText}`, errorBody);
      // Return a structured fallback with an empty or default hero slide array
      return {
        heroSlides: fallbackContent.heroSlides,
        artisanalRoots: fallbackContent.artisanalRoots
      };
    }
    const jsonData: HomepageContent = await res.json();
    // Ensure heroSlides is an array, default to fallback if not
    if (!Array.isArray(jsonData.heroSlides) || jsonData.heroSlides.length === 0) {
      jsonData.heroSlides = fallbackContent.heroSlides;
    }
    // Ensure artisanalRoots has fallback if missing
    if (!jsonData.artisanalRoots || !jsonData.artisanalRoots.title) {
      jsonData.artisanalRoots = fallbackContent.artisanalRoots;
    }
    return jsonData;
  } catch (error) {
    console.error("Error in getHomepageContent:", error);
    return fallbackContent;
  }
}

export default function HomePage() {
  const [content, setContent] = useState<HomepageContent>(fallbackContent);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const heroSlides = content.heroSlides || fallbackContent.heroSlides || [];
  const artisanalRootsTitle = content.artisanalRoots?.title || fallbackContent.artisanalRoots?.title || "Our Artisanal Roots";
  const artisanalRootsDescription = content.artisanalRoots?.description || fallbackContent.artisanalRoots?.description || "Details about our craftsmanship are currently unavailable.";

  useEffect(() => {
    const loadContent = async () => {
      setIsLoadingContent(true);
      const fetchedContent = await getHomepageContent();
      setContent(fetchedContent);
      setIsLoadingContent(false);
    };
    loadContent();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  }, [heroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (heroSlides.length > 1) {
      const slideInterval = setInterval(nextSlide, 7000); // Auto-slide every 7 seconds
      return () => clearInterval(slideInterval);
    }
  }, [heroSlides.length, nextSlide]);

  if (isLoadingContent) {
    // Basic loading state, can be improved with a skeleton loader
    return <div className="h-screen flex items-center justify-center">Loading Peak Pulse...</div>;
  }


  return (
    <>
      {/* Hero Section - Carousel */}
      <section style={{ backgroundColor: 'black' }} className="relative h-screen w-full overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Background Video/Image Container */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {slide.videoId ? (
                <>
                  <iframe
                    className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2"
                    src={`https://www.youtube.com/embed/${slide.videoId}?autoplay=1&mute=1&loop=1&playlist=${slide.videoId}&controls=0&showinfo=0&autohide=1&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title={slide.altText || "Peak Pulse Background Video"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={false}
                  ></iframe>
                  <div className="absolute inset-0 bg-black/30 z-[1]" /> {/* Overlay for video */}
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
                    data-ai-hint={slide.dataAiHint || "fashion mountains nepal"}
                  />
                  <div className="absolute inset-0 bg-black/30 z-[1]" /> {/* Overlay for image */}
                </>
              ) : null}
            </div>

            {/* Content Overlay for each slide */}
            <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[calc(theme(spacing.20)_+_theme(spacing.6))] pb-12 px-6 md:px-8 text-center text-white max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-neutral-200 mb-10 max-w-2xl mx-auto text-shadow-md">
                {slide.description}
              </p>
              {slide.ctaText && slide.ctaLink && (
                <Button size="lg" asChild className="text-base md:text-lg py-3 px-8 animate-fade-in-up">
                  <Link href={slide.ctaLink}>{slide.ctaText} <ShoppingBag className="ml-2 h-5 w-5" /></Link>
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Carousel Navigation */}
        {heroSlides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 z-30 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="h-7 w-7" />
            </Button>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
              {heroSlides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>


      {/* Featured Products Section - Mock Data */}
      <section className="section-padding container-wide relative z-[1]">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { id: 'prod-1', name: 'Himalayan Breeze Jacket', slug: 'himalayan-breeze-jacket', price: 12000, images: [{id: 'img-1', url: 'https://catalog-resize-images.thedoublef.com/606bc76216f1f9cb1ad8281eb9b7e84e/900/900/NF0A4QYXNY_P_NORTH-ZU31.a.jpg', altText: 'Himalayan Breeze Jacket', dataAiHint: 'jacket fashion'}], categories: [{id: 'cat-1', name: 'Outerwear', slug: 'outerwear'}], shortDescription: 'Lightweight and versatile.', createdAt: '', updatedAt: '', description: '' },
            { id: 'prod-2', name: 'Kathmandu Comfort Tee', slug: 'kathmandu-comfort-tee', price: 3500, images: [{id: 'img-2', url: 'https://placehold.co/600x800.png', altText: 'Kathmandu Comfort Tee', dataAiHint: 'tee shirt'}], categories: [{id: 'cat-2', name: 'Tops', slug: 'tops'}], shortDescription: 'Premium cotton for daily wear.', createdAt: '', updatedAt: '', description: '' },
            { id: 'prod-3', name: 'Urban Nomad Pants', slug: 'urban-nomad-pants', price: 7500, images: [{id: 'img-3', url: 'https://placehold.co/600x800.png', altText: 'Urban Nomad Pants', dataAiHint: 'pants fashion'}], categories: [{id: 'cat-3', name: 'Bottoms', slug: 'bottoms'}], shortDescription: 'Street-ready style.', createdAt: '', updatedAt: '', description: '' },
          ].map(product => (
            <ProductCard key={product.id} product={product as Product} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild className="text-base">
            <Link href="/products">View All Products <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Brand Story Snippet Section */}
      <section className="bg-card section-padding relative z-[1]">
        <div className="container-slim text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">{artisanalRootsTitle}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {artisanalRootsDescription}
          </p>
          <Button variant="default" size="lg" asChild className="text-base">
            <Link href="/our-story">Discover Our Story <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Social Commerce Section - Rebuilt */}
      <section className="section-padding container-wide relative z-[1]">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          #PeakPulseStyle <Instagram className="inline-block ml-2 h-7 w-7 text-pink-500" />
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <Link
              key={i}
              href="https://instagram.com/peakpulsenp"
              target="_blank"
              rel="noopener noreferrer"
              className="block group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              <AspectRatio ratio={1 / 1} className="bg-muted">
                <Image
                  src={`https://placehold.co/400x400.png?text=Post+${i}`} // Added text to placeholder for distinction
                  alt={`User generated content showcasing Peak Pulse style ${i}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                  data-ai-hint="instagram fashion user"
                />
              </AspectRatio>
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                <Instagram className="h-10 w-10 text-white mb-2" />
                <p className="text-sm font-semibold text-white">View on Instagram</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
            <Button variant="secondary" asChild>
                <Link href="https://instagram.com/peakpulsenp" target="_blank" rel="noopener noreferrer">
                    Follow us on Instagram <Instagram className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
        </div>
      </section>

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
