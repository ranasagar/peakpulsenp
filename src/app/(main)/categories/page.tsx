
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { AdminCategory as CategoryType } from '@/types';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader2, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout'; // Import MainLayout

async function fetchCategories(): Promise<CategoryType[]> {
  const response = await fetch('/api/categories'); // Fetches from Supabase
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch categories and parse error." }));
    throw new Error(errorData.message || `Failed to fetch categories: ${response.statusText}`);
  }
  return response.json();
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories);
      } catch (err) {
        console.error("Error loading categories:", err);
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        toast({
          title: "Error Loading Categories",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, [toast]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-wide section-padding flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading Categories...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container-wide section-padding text-center">
          <p className="text-destructive text-lg">Error: {error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout> {/* Wrap content with MainLayout */}
      <div className="container-wide section-padding">
        <div className="text-center mb-12 md:mb-16">
          <LayoutGrid className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Explore Our Collections
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-xl mx-auto">
            Discover unique styles across our diverse range of categories.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No categories available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug}`} passHref legacyBehavior>
                <a className="block group">
                  <Card className="overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full">
                    <AspectRatio ratio={4 / 3} className="relative bg-muted">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name || 'Category image'}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={category.aiImagePrompt || category.name.toLowerCase()}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <LayoutGrid className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end">
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight text-shadow-lg group-hover:text-primary transition-colors">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-sm text-neutral-200 mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </AspectRatio>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
