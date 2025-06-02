
"use client";

import MainLayout from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log('Search term submitted:', searchTerm);
      toast({
        title: "Search Submitted (Dev Mode)",
        description: `You searched for: "${searchTerm}". Full search results functionality is pending implementation.`,
      });
      // Future: router.push(`/search/results?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      toast({
        title: "Empty Search",
        description: "Please enter a term to search for.",
        variant: "default"
      });
    }
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

        <div className="mt-12 text-center border-t pt-12">
          {/* Placeholder for search results or suggestions */}
          <h2 className="text-2xl font-semibold text-foreground mb-4">Search Results</h2>
          <p className="text-muted-foreground">
            Enter a search term above to find products. Full search results will appear here.
          </p>
          {/* Example of how results might look (static for now) */}
          {/* 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {[1,2,3].map(i => (
              <div key={i} className="border p-4 rounded-lg bg-card shadow-sm">
                <div className="w-full h-48 bg-muted rounded-md mb-3 animate-pulse"></div>
                <div className="h-6 w-3/4 bg-muted rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div> 
          */}
        </div>
      </div>
    </MainLayout>
  );
}
