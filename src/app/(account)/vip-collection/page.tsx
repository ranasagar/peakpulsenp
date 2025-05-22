
"use client";

import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';
import { Gem, Crown } from 'lucide-react';

// Access control for this page is primarily handled by src/app/(account)/layout.tsx

const mockVipProducts: Product[] = [
  {
    id: 'vip-prod-1', name: 'Exclusive Artisan Jacket', slug: 'exclusive-artisan-jacket', price: 25000,
    images: [{ id: 'vip-img-1', url: 'https://placehold.co/600x800.png', altText: 'Exclusive VIP Artisan Jacket', dataAiHint: 'exclusive jacket' }],
    categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }],
    shortDescription: 'Limited edition, handcrafted masterpiece.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description for VIP product.",
    stock: 5, costPrice: 15000,
  },
  {
    id: 'vip-prod-2', name: 'Royal Silk Robe', slug: 'royal-silk-robe', price: 18000,
    images: [{ id: 'vip-img-2', url: 'https://placehold.co/600x800.png', altText: 'Royal Silk Robe for VIPs', dataAiHint: 'silk robe' }],
    categories: [{ id: 'cat-5', name: 'Loungewear', slug: 'loungewear' }],
    shortDescription: 'Luxurious pure silk with intricate embroidery.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description for VIP product.",
    stock: 3, costPrice: 10000,
  },
];

export default function VipCollectionPage() {
  return (
    <div className="container-wide section-padding">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
          <Crown className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
          VIP Exclusive Collection
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Welcome to the Peak Pulse VIP lounge. Discover pieces curated specially for our most valued members.
        </p>
      </div>

      {mockVipProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockVipProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Gem className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground mb-2">No VIP Products Currently Available</p>
          <p className="text-muted-foreground">Check back soon for exclusive new arrivals.</p>
        </div>
      )}
    </div>
  );
}
