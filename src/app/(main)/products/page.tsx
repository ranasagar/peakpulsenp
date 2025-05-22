
"use client";

import { useState, useEffect, useMemo, useCallback }  from 'react';
import { ProductCard } from '@/components/product/product-card';
import type { Product, AdminCategory as CategoryType } from '@/types'; // Updated to AdminCategory
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SlidersHorizontal, ChevronDown, ListFilter, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';

const PRODUCTS_PER_PAGE = 6;

interface FilterSidebarContentProps {
  categories: CategoryType[];
  selectedCategories: string[];
  onCategoryChange: (categorySlug: string, isChecked: boolean) => void;
  onApplyFilters: () => void; // Placeholder for now
  onClearFilters: () => void;  // Placeholder for now
}

const FilterSidebarContent = ({ 
  categories, 
  selectedCategories, 
  onCategoryChange,
  onApplyFilters,
  onClearFilters 
}: FilterSidebarContentProps) => (
  <ScrollArea className="h-full p-1">
    <div className="p-5 space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Filters</h3>
      <Separator />
      <Accordion type="multiple" defaultValue={['category']} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="text-md font-medium hover:no-underline">Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`category-${category.slug}`} 
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={(checked) => onCategoryChange(category.slug, !!checked)}
                />
                <Label htmlFor={`category-${category.slug}`} className="font-normal text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories available.</p>}
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* Placeholder for other filter types like size, color */}
        <AccordionItem value="size" disabled>
          <AccordionTrigger className="text-md font-medium hover:no-underline opacity-50">Size (Coming Soon)</AccordionTrigger>
          <AccordionContent><p className="text-sm text-muted-foreground">Size filters will be available soon.</p></AccordionContent>
        </AccordionItem>
        <AccordionItem value="color" disabled>
          <AccordionTrigger className="text-md font-medium hover:no-underline opacity-50">Color (Coming Soon)</AccordionTrigger>
          <AccordionContent><p className="text-sm text-muted-foreground">Color filters will be available soon.</p></AccordionContent>
        </AccordionItem>
      </Accordion>
       {/* <Button className="w-full mt-6" onClick={onApplyFilters}>Apply Filters</Button>
       <Button variant="outline" className="w-full" onClick={onClearFilters}>Clear Filters</Button> */}
       <p className="text-xs text-muted-foreground mt-4">Filters apply automatically. More filter options coming soon.</p>
    </div>
  </ScrollArea>
);


export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();

  const fetchProductsAndCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/products'), // Fetches from Supabase, sorted by createdAt
        fetch('/api/categories') // Fetches categories from Supabase
      ]);

      if (!productsResponse.ok) {
        let errorDetail = 'Failed to fetch products';
        try {
          const errorData = await productsResponse.json();
          errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server responded with ${productsResponse.status}: ${productsResponse.statusText}`;
        } catch (e) { /* ignore if not json */ }
        throw new Error(errorDetail);
      }
      const productsData: Product[] = await productsResponse.json();
      setAllProducts(productsData);

      if (!categoriesResponse.ok) {
        console.warn("Failed to fetch categories for filtering.");
        // Proceed without category filters if this fails, or throw an error
      } else {
        const categoriesData: CategoryType[] = await categoriesResponse.json();
        setCategories(categoriesData);
      }

    } catch (error) {
      console.error("Error fetching products or categories:", error);
      toast({
        title: "Error Loading Data",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  const filteredProducts = useMemo(() => {
    let productsToFilter = [...allProducts];

    // Sort products (example, can be expanded)
    if (sortOption === 'price-asc') {
      productsToFilter.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      productsToFilter.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'newest') {
      productsToFilter.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } // 'featured' is often the default sort from the API (e.g. by newest)

    if (selectedCategories.length > 0) {
      productsToFilter = productsToFilter.filter(product => 
        product.categories.some(cat => selectedCategories.includes(cat.slug))
      );
    }
    return productsToFilter;
  }, [allProducts, selectedCategories, sortOption]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, currentPage * PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const hasMoreProducts = displayedProducts.length < filteredProducts.length;

  const loadMoreProducts = () => {
    if (!hasMoreProducts || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => { // Simulate network delay
      setCurrentPage(prevPage => prevPage + 1);
      setIsLoadingMore(false);
    }, 500);
  };

  const handleCategoryChange = (categorySlug: string, isChecked: boolean) => {
    setSelectedCategories(prev => {
      const newSelected = isChecked 
        ? [...prev, categorySlug] 
        : prev.filter(slug => slug !== categorySlug);
      setCurrentPage(1); // Reset to first page when filters change
      return newSelected;
    });
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
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Shop All</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Discover our latest collections, crafted with passion and precision.
          </p>
        </div>

        <div className="flex items-center justify-between mb-8 sticky top-[calc(theme(spacing.20)_-_theme(spacing.8))_] bg-background/80 backdrop-blur-md py-3 z-40 -mx-4 px-4 border-b">
          <div>
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <ListFilter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs p-0">
                 <SheetHeader className="p-4 border-b">
                    <SheetTitle className="sr-only">Product Filters</SheetTitle>
                 </SheetHeader>
                <FilterSidebarContent 
                  categories={categories} 
                  selectedCategories={selectedCategories} 
                  onCategoryChange={handleCategoryChange}
                  onApplyFilters={() => setIsMobileFiltersOpen(false)} // Example action
                  onClearFilters={() => setSelectedCategories([])}    // Example action
                />
              </SheetContent>
            </Sheet>
            <span className="ml-2 text-sm text-muted-foreground hidden md:inline">Showing {displayedProducts.length} of {filteredProducts.length} products</span>
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
          <aside className="hidden lg:block lg:col-span-1 sticky top-[calc(9rem_+_1px)] h-[calc(100vh_-_(9rem_+_1px)_-_theme(spacing.16))]">
            <div className="bg-card rounded-lg shadow-sm border h-full">
              <FilterSidebarContent 
                categories={categories} 
                selectedCategories={selectedCategories} 
                onCategoryChange={handleCategoryChange}
                onApplyFilters={() => {}} // Desktop might not need explicit apply/clear buttons if filters apply instantly
                onClearFilters={() => setSelectedCategories([])}
              />
            </div>
          </aside>

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
