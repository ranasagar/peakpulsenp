
"use client";

import MainLayout from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { Search as SearchIcon, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Product, Metadata } from '@/types';

// Static metadata for the search page itself
export const metadata: Metadata = {
  title: 'Search Products - Peak Pulse',
  description: 'Search for your favorite apparel and collections from Peak Pulse. Find unique Nepali craftsmanship blended with contemporary streetwear.',
  keywords: ['search products', 'find Peak Pulse', 'product search', 'Nepali fashion search'],
  openGraph: {
    title: 'Search Products | Peak Pulse',
    description: 'Find what you\'re looking for in our collections.',
    url: '/search',
  },
  alternates: {
    canonical: '/search',
  },
  robots: { // Search result pages are often noindexed if they are thin content, but a primary search page can be indexed.
    index: true,
    follow: true,
  }
};


export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoading(true);
      setHasSearched(false); 
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData: Product[] = await response.json();
        setAllProducts(productsData);
        
        const initialQuery = searchParams.get('q');
        if (initialQuery) {
          setSearchTerm(initialQuery);
          performSearch(initialQuery, productsData);
        } else {
          setIsLoading(false); 
        }
      } catch (error) {
        toast({
          title: "Error Loading Products",
          description: (error as Error).message,
          variant: "destructive",
        });
        setAllProducts([]);
        setIsLoading(false);
      }
    };
    fetchAllProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); 

  const performSearch = (query: string, productsToSearch: Product[]) => {
    setIsLoading(true); 
    setHasSearched(true);
    const lowerCaseQuery = query.toLowerCase().trim();

    if (!lowerCaseQuery) {
      setFilteredProducts([]);
      setIsLoading(false);
      return;
    }

    const results = productsToSearch.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowerCaseQuery);
      const shortDescMatch = product.shortDescription?.toLowerCase().includes(lowerCaseQuery);
      const descMatch = product.description.toLowerCase().includes(lowerCaseQuery);
      const categoryMatch = product.categories.some(cat => cat.name.toLowerCase().includes(lowerCaseQuery));
      const skuMatch = product.sku?.toLowerCase().includes(lowerCaseQuery);
      return nameMatch || shortDescMatch || descMatch || categoryMatch || skuMatch;
    });

    setFilteredProducts(results);
    setIsLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    router.push(`/search?q=${encodeURIComponent(trimmedSearchTerm)}`);
    performSearch(trimmedSearchTerm, allProducts); 
  };
  
  return (
    <MainLayout>
      <div className="container-wide section-padding">
        <div className="text-center mb-12">
          <SearchIcon className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Search Our Store</h1>
          <p className="text-lg text-muted-foreground mt-2">Find your next favorite piece from Peak Pulse.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2 mb-12">
          <Input
            type="search"
            placeholder="Search for products, collections..."
            className="h-12 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search input"
          />
          <Button type="submit" size="lg" className="h-12">
            <SearchIcon className="mr-0 md:mr-2 h-5 w-5" />
            <span className="hidden md:inline">Search</span>
          </Button>
        </form>

        <div className="mt-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Searching...</p>
            </div>
          ) : hasSearched ? (
            filteredProducts.length > 0 ? (
              <>
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Search Results for &quot;{decodeURIComponent(searchParams.get('q') || searchTerm)}&quot; ({filteredProducts.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <XCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-foreground mb-2">No products found</p>
                <p className="text-muted-foreground">
                  We couldn&apos;t find any products matching &quot;{decodeURIComponent(searchParams.get('q') || searchTerm)}&quot;. Try a different search term.
                </p>
              </div>
            )
          ) : (
             allProducts.length > 0 && !searchParams.get('q') && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Enter a term above to search through {allProducts.length} available products.</p>
                </div>
            )
          )}
        </div>
      </div>
    </MainLayout>
  );
}
