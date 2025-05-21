
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
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout'; // Import MainLayout

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          let errorDetail = 'Failed to fetch products';
          try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.error || errorDetail;
          } catch (e) {
            // Failed to parse JSON, use status text or default
            errorDetail = `${response.status}: ${response.statusText || errorDetail}`;
          }
          throw new Error(errorDetail);
        }
        const data: Product[] = await response.json();
        setAllProducts(data);
        setDisplayedProducts(data.slice(0, PRODUCTS_PER_PAGE));
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error Loading Products",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [toast]);


  const hasMoreProducts = displayedProducts.length < allProducts.length;

  const loadMoreProducts = () => {
    if (!hasMoreProducts || isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => { // Simulate network delay for UX
      const nextPage = currentPage + 1;
      const newProductsToDisplay = allProducts.slice(0, nextPage * PRODUCTS_PER_PAGE);
      setDisplayedProducts(newProductsToDisplay);
      setCurrentPage(nextPage);
      setIsLoadingMore(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-wide section-padding flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading Products...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
            <span className="ml-2 text-sm text-muted-foreground hidden md:inline">Showing {displayedProducts.length} of {allProducts.length} products</span>
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
          <aside className="hidden lg:block lg:col-span-1 sticky top-[calc(9rem_+_1px)] h-[calc(100vh_-_(9rem_+_1px)_-_theme(spacing.16))]">
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
    </MainLayout>
  );
}
