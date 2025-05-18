
"use client";

import { useState, useEffect }  from 'react';
import { ProductCard } from '@/components/product/product-card';
import type { Product, FilterOption } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SlidersHorizontal, ChevronDown, ListFilter, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';


// Mock products - replace with actual data fetching
const allMockProducts: Product[] = [
  {
    id: 'prod-1', name: 'Himalayan Breeze Jacket', slug: 'himalayan-breeze-jacket', price: 12000,
    images: [{ id: 'img-1', url: 'https://placehold.co/600x800.png', altText: 'Himalayan Breeze Jacket front view', dataAiHint: 'jacket fashion' }],
    categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }],
    shortDescription: 'Lightweight and versatile for urban adventures.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-2', name: 'Kathmandu Comfort Tee', slug: 'kathmandu-comfort-tee', price: 3500,
    images: [{ id: 'img-2', url: 'https://placehold.co/600x800.png', altText: 'Kathmandu Comfort Tee front view', dataAiHint: 'tee shirt' }],
    categories: [{ id: 'cat-2', name: 'Tops', slug: 'tops' }],
    shortDescription: 'Premium cotton for everyday luxury.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-3', name: 'Urban Nomad Pants', slug: 'urban-nomad-pants', price: 7500,
    images: [{ id: 'img-3', url: 'https://placehold.co/600x800.png', altText: 'Urban Nomad Pants front view', dataAiHint: 'pants fashion' }],
    categories: [{ id: 'cat-3', name: 'Bottoms', slug: 'bottoms' }],
    shortDescription: 'Street-ready style with traditional touches.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-4', name: 'Silk Scarf Mandala', slug: 'silk-scarf-mandala', price: 4200, 
    images: [{ id: 'img-4', url: 'https://placehold.co/600x800.png', altText: 'Silk Scarf with Mandala design', dataAiHint: 'scarf silk' }], 
    categories: [{ id: 'cat-4', name: 'Accessories', slug: 'accessories' }], 
    shortDescription: 'Hand-painted pure silk elegance.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
  {
    id: 'prod-5', name: 'Artisan Leather Wallet', slug: 'artisan-leather-wallet', price: 5800, 
    images: [{ id: 'img-5', url: 'https://placehold.co/600x800.png', altText: 'Handcrafted Artisan Leather Wallet', dataAiHint: 'leather wallet' }], 
    categories: [{ id: 'cat-4', name: 'Accessories', slug: 'accessories' }], 
    shortDescription: 'Handcrafted full-grain leather wallet.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
   {
    id: 'prod-6', name: 'Everest Summit Hoodie', slug: 'everest-summit-hoodie', price: 9800, 
    images: [{ id: 'img-6', url: 'https://placehold.co/600x800.png', altText: 'Everest Summit Hoodie', dataAiHint: 'summit hoodie' }], 
    categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }], 
    shortDescription: 'Warmth and style inspired by the highest peaks.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
  // Add more mock products for pagination demo
  {
    id: 'prod-7', name: 'Pashmina Shawl', slug: 'pashmina-shawl', price: 11000,
    images: [{ id: 'img-7', url: 'https://placehold.co/600x800.png', altText: 'Luxurious Pashmina Shawl', dataAiHint: 'pashmina shawl' }],
    categories: [{ id: 'cat-4', name: 'Accessories', slug: 'accessories' }],
    shortDescription: 'Authentic Nepali pashmina, soft and warm.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-8', name: 'Bohemian Rhapsody Dress', slug: 'bohemian-rhapsody-dress', price: 8500,
    images: [{ id: 'img-8', url: 'https://placehold.co/600x800.png', altText: 'Bohemian Rhapsody Dress', dataAiHint: 'bohemian dress' }],
    categories: [{ id: 'cat-5', name: 'Dresses', slug: 'dresses' }], // Assuming a new category
    shortDescription: 'Flowy and free-spirited, perfect for any occasion.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-9', name: 'Heritage Weave Backpack', slug: 'heritage-weave-backpack', price: 6200,
    images: [{ id: 'img-9', url: 'https://placehold.co/600x800.png', altText: 'Heritage Weave Backpack', dataAiHint: 'weave backpack' }],
    categories: [{ id: 'cat-4', name: 'Accessories', slug: 'accessories' }],
    shortDescription: 'Durable backpack with traditional Nepali weave patterns.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  }
];

const PRODUCTS_PER_PAGE = 6;

const mockFilters: FilterOption[] = [
  { id: 'category', label: 'Category', type: 'checkbox', options: [
    { value: 'outerwear', label: 'Outerwear' }, { value: 'tops', label: 'Tops' },
    { value: 'bottoms', label: 'Bottoms' }, { value: 'accessories', label: 'Accessories' },
    { value: 'dresses', label: 'Dresses'}
  ]},
  { id: 'size', label: 'Size', type: 'checkbox', options: [
    { value: 's', label: 'Small' }, { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' }, { value: 'xl', label: 'X-Large' }
  ]},
  { id: 'color', label: 'Color', type: 'color', options: [
    { value: 'red', label: 'Red', color: '#E53E3E' }, { value: 'blue', label: 'Blue', color: '#3182CE'},
    { value: 'green', label: 'Green', color: '#38A169' }, { value: 'black', label: 'Black', color: '#1A202C'}
  ]},
];


const FilterSidebarContent = ({ filters }: { filters: FilterOption[] }) => (
  <ScrollArea className="h-full p-1">
    <div className="p-5 space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Filters</h3>
      <Separator />
      <Accordion type="multiple" defaultValue={filters.map(f => f.id)} className="w-full">
        {filters.map(filter => (
          <AccordionItem key={filter.id} value={filter.id}>
            <AccordionTrigger className="text-md font-medium hover:no-underline">{filter.label}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
              {filter.type === 'checkbox' && filter.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox id={`${filter.id}-${option.value}`} />
                  <Label htmlFor={`${filter.id}-${option.value}`} className="font-normal text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
              {filter.type === 'color' && (
                <div className="flex flex-wrap gap-2">
                  {filter.options?.map(option => (
                    <Button key={option.value} variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" title={option.label} style={{backgroundColor: option.color}}>
                       <span className="sr-only">{option.label}</span>
                    </Button>
                  ))}
                </div>
              )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
       <Button className="w-full mt-6">Apply Filters</Button>
       <Button variant="outline" className="w-full">Clear Filters</Button>
    </div>
  </ScrollArea>
);


export default function ProductsPage() {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(allMockProducts.slice(0, PRODUCTS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMoreProducts = displayedProducts.length < allMockProducts.length;

  const loadMoreProducts = () => {
    if (!hasMoreProducts || isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => { // Simulate network delay
      const nextPage = currentPage + 1;
      const newProducts = allMockProducts.slice(0, nextPage * PRODUCTS_PER_PAGE);
      setDisplayedProducts(newProducts);
      setCurrentPage(nextPage);
      setIsLoadingMore(false);
    }, 500);
  };

  return (
    <div className="container-wide section-padding">
      {/* Page Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Shop All</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Discover our latest collections, crafted with passion and precision.
        </p>
      </div>

      {/* Toolbar: Sort and Mobile Filter Trigger */}
      <div className="flex items-center justify-between mb-8 sticky top-[calc(theme(spacing.20)_-_theme(spacing.8))_] bg-background/80 backdrop-blur-md py-3 z-40 -mx-4 px-4 border-b">
        <div>
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <ListFilter className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs p-0">
              <FilterSidebarContent filters={mockFilters} />
            </SheetContent>
          </Sheet>
           <span className="ml-2 text-sm text-muted-foreground hidden md:inline">Showing {displayedProducts.length} of {allMockProducts.length} products</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Sort by: {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortOption('featured')}>Featured</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('newest')}>Newest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('price-asc')}>Price: Low to High</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('price-desc')}>Price: High to Low</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-[calc(theme(spacing.20)_-_theme(spacing.8)_+_4rem_+_1px)] h-[calc(100vh_-_theme(spacing.20)_-_theme(spacing.8)_-_4rem_-_1px_-_theme(spacing.16))]">
          <div className="bg-card rounded-lg shadow-sm border h-full">
             <FilterSidebarContent filters={mockFilters} />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <SlidersHorizontal className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-foreground mb-2">No Products Found</p>
              <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
            </div>
          )}
          {/* Load More Button */}
          {hasMoreProducts && (
            <div className="mt-12 flex justify-center">
              <Button variant="outline" onClick={loadMoreProducts} disabled={isLoadingMore}>
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Products'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
