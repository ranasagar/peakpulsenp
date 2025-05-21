
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, RotateCcw, MapPin, PackageOpen, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PageContent } from '@/types';

const PAGE_KEY = 'shippingReturnsPageContent';

export default function ShippingReturnsPage() {
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/content/page/${PAGE_KEY}`);
        if (!response.ok) {
          const errorData: PageContent = await response.json().catch(() => ({ content: `Failed to load content. Status: ${response.status}`}));
          throw new Error(errorData.error || errorData.content || `Failed to fetch content for ${PAGE_KEY}`);
        }
        const data: PageContent = await response.json();
        setPageContent(data.content);
      } catch (error) {
        toast({ title: "Error Loading Content", description: (error as Error).message, variant: "destructive" });
        setPageContent("<p>Error: Could not load Shipping & Returns information at this time. Please try again later or contact support.</p>");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [toast]);

  return (
    <div className="container-slim section-padding">
      <div className="text-center mb-16">
        <Truck className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Shipping & Returns
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Information about how we get our products to you and how to handle returns.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none text-foreground space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : pageContent ? (
            <div dangerouslySetInnerHTML={{ __html: pageContent }} />
          ) : (
            <p>Shipping & Returns information is not yet available. Please configure this in the admin panel.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
