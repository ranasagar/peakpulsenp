
"use client";

import { useState, useEffect }  from 'react';
import { ProductCard } from '@/components/product/product-card';
import type { Product, FilterOption } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SlidersHorizontal, ChevronDown, ListFilter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';


// Mock products - replace with actual data fetching
const mockProducts: Product[] = [
  {
    id: 'prod-1', name: 'Himalayan Breeze Jacket', slug: 'himalayan-breeze-jacket', price: 12000,
    images: [{ id: 'img-1', url: 'https://placehold.co/600x800.png?text=Jacket+1', altText: 'Jacket 1' }],
    categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }],
    shortDescription: 'Lightweight and versatile for urban adventures.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-2', name: 'Kathmandu Comfort Tee', slug: 'kathmandu-comfort-tee', price: 3500,
    images: [{ id: 'img-2', url: 'https://placehold.co/600x800.png?text=Tee+1', altText: 'Tee 1' }],
    categories: [{ id: 'cat-2', name: 'Tops', slug: 'tops' }],
    shortDescription: 'Premium cotton for everyday luxury.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-3', name: 'Urban Nomad Pants', slug: 'urban-nomad-pants', price: 7500,
    images: [{ id: 'img-3', url: 'https://placehold.co/600x800.png?text=Pants+1', altText: 'Pants 1' }],
    categories: [{ id: 'cat-3', name: 'Bottoms', slug: 'bottoms' }],
    shortDescription: 'Street-ready style with traditional touches.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full description here."
  },
  {
    id: 'prod-4', name: 'Silk Scarf Mandala', slug: 'silk-scarf-mandala', price: 4200, 
    images: [{ id: 'img-4', url: 'https://placehold.co/600x800.png?text=Scarf+1', altText: 'Scarf 1' }], 
    categories: [{ id: 'cat-4', name: 'Accessories', slug: 'accessories' }], 
    shortDescription: 'Hand-painted pure silk elegance.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
  {
    id: 'prod-5', name: 'Artisan Leather Wallet', slug: 'artisan-leather-wallet', price: 5800, 
    images: [{ id: 'img-5', url: 'https://placehold.co/600x800.png?text=Wallet+1', altText: 'Wallet 1' }], 
    categories: [{ id: 'cat-4', name: 'Accessories', slug: 'accessories' }], 
    shortDescription: 'Handcrafted full-grain leather wallet.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
   {
    id: 'prod-6', name: 'Everest Summit Hoodie', slug: 'everest-summit-hoodie', price: 9800, 
    images: [{ id: 'img-6', url: 'https://placehold.co/600x800.png?text=Hoodie+1', altText: 'Hoodie 1' }], 
    categories: [{ id: 'cat-1', name: 'Outerwear', slug: 'outerwear' }], 
    shortDescription: 'Warmth and style inspired by the highest peaks.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: "Full desc here"
  },
];

const mockFilters: FilterOption[] = [
  { id: 'category', label: 'Category', type: 'checkbox', options: [
    { value: 'outerwear', label: 'Outerwear' }, { value: 'tops', label: 'Tops' },
    { value: 'bottoms', label: 'Bottoms' }, { value: 'accessories', label: 'Accessories' }
  ]},
  { id: 'size', label: 'Size', type: 'checkbox', options: [
    { value: 's', label: 'Small' }, { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' }, { value: 'xl', label: 'X-Large' }
  ]},
  { id: 'color', label: 'Color', type: 'color', options: [
    { value: 'red', label: 'Red', color: '#E53E3E' }, { value: 'blue', label: 'Blue', color: '#3182CE'},
    { value: 'green', label: 'Green', color: '#38A169' }, { value: 'black', label: 'Black', color: '#1A202C'}
  ]},
  // Price range filter would require a slider component, example:
  // { id: 'price', label: 'Price Range', type: 'range', min: 0, max: 20000, step: 1000 },
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
              {/* TODO: Add range slider for price */}
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
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [sortOption, setSortOption] = useState('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // TODO: Implement actual filtering and sorting logic
  // useEffect to fetch products based on filters/sort

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
      <div className="flex items-center justify-between mb-8 sticky top-20 bg-background/80 backdrop-blur-md py-3 z-40 -mx-4 px-4 border-b">
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
           <span className="ml-2 text-sm text-muted-foreground hidden md:inline">Showing {products.length} products</span>
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
        <aside className="hidden lg:block lg:col-span-1 sticky top-[calc(5rem+2.75rem+1px)] h-[calc(100vh-5rem-2.75rem-2rem)]"> {/* Adjust top based on header and toolbar height */}
          <div className="bg-card rounded-lg shadow-sm border h-full">
             <FilterSidebarContent filters={mockFilters} />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {products.map(product => (
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
          {/* TODO: Add Pagination */}
          <div className="mt-12 flex justify-center">
             <Button variant="outline" disabled>Load More (Pagination UI)</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
