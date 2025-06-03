
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PageContent } from '@/types'; // Metadata import removed

// Removed export const metadata block

const PAGE_KEY = 'termsOfServicePageContent'; // Key used in Supabase site_configurations

export default function TermsOfServicePage() {
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
        setPageContent("<p>Error: Could not load the Terms of Service at this time. Please try again later or contact support if the issue persists.</p>");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [toast]);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center mb-4">
            <FileText className="h-10 w-10 mr-4 text-primary" />
            <CardTitle className="text-3xl font-bold text-foreground">Terms of Service</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="prose prose-lg dark:prose-invert max-w-none text-foreground">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : pageContent ? (
          <div dangerouslySetInnerHTML={{ __html: pageContent }} />
        ) : (
          <p>No terms of service content available. Please configure this in the admin panel.</p>
        )}
      </CardContent>
    </Card>
  );
}
