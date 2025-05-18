
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';
import { ArrowRight, Instagram, Send, ShoppingBag } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';

interface HomepageContent {
  hero: {
    title: string;
    description: string;
    videoId?: string;
    imageUrl?: string;
  };
  artisanalRoots?: {
    title: string;
    description: string;
  };
}

async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const res = await fetch(`${baseUrl}/api/content/homepage`, { cache: 'no-store' });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Failed to fetch content: ${res.status} ${res.statusText}`, errorBody);
      // Fallback content in case of an error
      return {
        hero: {
          title: "Peak Pulse (Content API Error)",
          description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Content failed to load, displaying fallback)",
          videoId: undefined,
          imageUrl: undefined,
        },
        artisanalRoots: {
          title: "Our Artisanal Roots (Content API Error)",
          description: "Content failed to load. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen."
        }
      };
    }
    const jsonData = await res.json();
    // Ensure videoId and imageUrl are undefined if they are empty strings from JSON
    if (jsonData.hero && jsonData.hero.videoId === "") {
      jsonData.hero.videoId = undefined;
    }
    if (jsonData.hero && jsonData.hero.imageUrl === "") {
      jsonData.hero.imageUrl = undefined;
    }
    return jsonData;
  } catch (error) {
    console.error("Error fetching homepage content in page.tsx:", error);
    // Fallback content on any catch
    return {
      hero: {
        title: "Peak Pulse (Network Error)",
        description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Content failed to load, displaying fallback)",
        videoId: undefined,
        imageUrl: undefined,
      },
      artisanalRoots: {
        title: "Our Artisanal Roots (Network Error)",
        description: "Content failed to load. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen."
      }
    };
  }
}

export default async function HomePage() {
  const content = await getHomepageContent();
  const heroTitle = content.hero?.title;
  const heroDescription = content.hero?.description;
  const heroVideoId = content.hero?.videoId;
  const heroImageUrl = content.hero?.imageUrl;

  const artisanalRootsTitle = content.artisanalRoots?.title || "Our Artisanal Roots";
  const artisanalRootsDescription = content.artisanalRoots?.description || "At Peak Pulse, every thread tells a story. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen.";


  return (
    <>
      {/* Hero Section - Updated for Full-Screen Immersive Experience */}
      <section
        style={{ backgroundColor: 'black' }} // Ultimate fallback background
        className="relative h-screen w-full overflow-hidden"
      >
        {/* Background Video/Image Container */}
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden pointer-events-none bg-black"> {/* Added bg-black here */}
          {heroVideoId ? (
            <>
              <iframe
                className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2"
                src={`https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${heroVideoId}&controls=0&showinfo=0&autohide=1&modestbranding=1&playsinline=1&enablejsapi=1`}
                title="Peak Pulse Background Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={false}
              ></iframe>
              <div className="absolute inset-0 bg-black/30 z-[1]"></div> {/* Overlay for video */}
            </>
          ) : heroImageUrl ? (
            <>
              <Image
                src={heroImageUrl}
                alt="Peak Pulse Hero Background"
                layout="fill"
                objectFit="cover"
                priority
                data-ai-hint="fashion mountains nepal"
              />
              <div className="absolute inset-0 bg-black/30 z-[1]"></div> {/* Overlay for image */}
            </>
          ) : null}
        </div>

        {/* Content Overlay */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[calc(theme(spacing.20)_+_theme(spacing.6))] pb-12 px-6 md:px-8 text-center text-white max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-neutral-200 mb-10 max-w-2xl mx-auto">
            {heroDescription}
          </p>
          <Button size="lg" asChild className="text-base md:text-lg py-3 px-8">
            <Link href="/products">Shop Collections <ShoppingBag className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Featured Products Section - Mock Data */}
      <section className="section-padding container-wide">
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
      <section className="bg-card section-padding">
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

      {/* Social Commerce Section */}
      <section className="section-padding container-wide">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          #PeakPulseStyle <Instagram className="inline-block ml-2 h-7 w-7 text-pink-500" />
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Link key={i} href="https://instagram.com/peakpulsenp" target="_blank" rel="noopener noreferrer" className="block bg-muted rounded-lg overflow-hidden group">
              <div className="aspect-square"> {/* Use div for aspect ratio control with next/image */}
                <Image
                  src={`https://placehold.co/400x400.png`}
                  alt={`User generated content showcasing Peak Pulse style ${i}`}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint="instagram fashion user"
                />
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
            <Button variant="secondary" asChild>
                <Link href="https://instagram.com/peakpulsenp" target="_blank" rel="noopener noreferrer">
                    Follow us on Instagram <Instagram className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className="bg-primary/5 section-padding">
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
