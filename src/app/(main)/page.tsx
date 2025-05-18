
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';
import { ArrowRight, Instagram, Send, ShoppingBag } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Mock products - replace with actual data fetching
const mockFeaturedProducts: Product[] = [
  {
    id: 'prod-1', name: 'Himalayan Breeze Jacket', slug: 'himalayan-breeze-jacket', price: 12000,
    images: [{ id: 'img-1', url: 'https://placehold.co/600x800.png', altText: 'Himalayan Breeze Jacket' }],
    categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }],
    shortDescription: 'Lightweight and versatile for urban adventures.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-2', name: 'Kathmandu Comfort Tee', slug: 'kathmandu-comfort-tee', price: 3500,
    images: [{ id: 'img-2', url: 'https://placehold.co/600x800.png', altText: 'Kathmandu Comfort Tee' }],
    categories: [{ id: 'cat-2', name: 'Tops', slug: 'tops' }],
    shortDescription: 'Premium cotton for everyday luxury.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-3', name: 'Urban Nomad Pants', slug: 'urban-nomad-pants', price: 7500,
    images: [{ id: 'img-3', url: 'https://placehold.co/600x800.png', altText: 'Urban Nomad Pants' }],
    categories: [{ id: 'cat-3', name: 'Bottoms', slug: 'bottoms' }],
    shortDescription: 'Street-ready style with traditional touches.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
];

interface HomepageContent {
  hero: {
    title: string;
    description: string;
  };
}

async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'; // Ensure this is set
    const res = await fetch(`${baseUrl}/api/content/homepage`, { cache: 'no-store' });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Failed to fetch content: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`Failed to fetch content: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching homepage content in page.tsx:", error);
    // Fallback content
    return {
      hero: {
        title: "Peak Pulse (Fallback)",
        description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Content failed to load)"
      }
    };
  }
}

export default async function HomePage() {
  const content = await getHomepageContent();
  const heroTitle = content.hero?.title || "Peak Pulse";
  const heroDescription = content.hero?.description || "Experience the fusion of ancient Nepali artistry and modern streetwear.";

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[85vh] w-full flex items-center justify-center text-center text-white bg-muted/30">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="Dramatic mountain landscape with stylish model wearing Peak Pulse apparel"
          layout="fill"
          objectFit="cover"
          className="z-0 opacity-50"
          priority
          data-ai-hint="mountain landscape fashion"
        />
        <div className="relative z-10 p-6 bg-black/30 backdrop-blur-sm rounded-lg">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-neutral-200 mb-8 max-w-2xl mx-auto">
            {heroDescription}
          </p>
          <Button size="lg" asChild className="text-base">
            <Link href="/products">Shop Collections <ShoppingBag className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section-padding container-wide">
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

      {/* Brand Story Snippet Section */}
      <section className="bg-card section-padding">
        <div className="container-slim text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Our Artisanal Roots</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            At Peak Pulse, every thread tells a story. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen.
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
            <Link key={i} href="https://instagram.com/peakpulse" target="_blank" rel="noopener noreferrer" className="block bg-muted rounded-lg overflow-hidden group">
              <AspectRatio ratio={1 / 1}>
                <Image
                  src={`https://placehold.co/400x400.png`}
                  alt={`User generated content showcasing Peak Pulse style ${i}`}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint="fashion lifestyle social"
                />
              </AspectRatio>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
            <Button variant="secondary" asChild>
                <Link href="https://instagram.com/peakpulse" target="_blank" rel="noopener noreferrer">
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

    