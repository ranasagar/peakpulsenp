
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PersonStanding, Eye, Ear, MousePointerClick, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PageContent } from '@/types';

const PAGE_KEY = 'accessibilityPageContent';

export default function AccessibilityPage() {
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
        setPageContent("<p>Error: Could not load the Accessibility Statement at this time. Please try again later or contact support.</p>");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [toast]);

  return (
    <div className="container-slim section-padding">
      <div className="text-center mb-16">
        <PersonStanding className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Accessibility Statement
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Peak Pulse is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Our Commitment</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none text-foreground space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : pageContent ? (
            <div dangerouslySetInnerHTML={{ __html: pageContent }} />
          ) : (
             <p>Accessibility Statement content is not yet available. Please configure this in the admin panel.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <Card className="p-6 bg-card">
              <Eye className="h-10 w-10 text-primary mx-auto mb-3"/>
              <h4 className="font-semibold text-lg">Visual Accessibility</h4>
              <p className="text-sm text-muted-foreground">Resizable text, sufficient contrast, and alt text for images.</p>
          </Card>
          <Card className="p-6 bg-card">
              <Ear className="h-10 w-10 text-primary mx-auto mb-3"/>
              <h4 className="font-semibold text-lg">Auditory Accessibility</h4>
              <p className="text-sm text-muted-foreground">Transcripts or captions for video content where applicable.</p>
          </Card>
          <Card className="p-6 bg-card">
              <MousePointerClick className="h-10 w-10 text-primary mx-auto mb-3"/>
              <h4 className="font-semibold text-lg">Motor Accessibility</h4>
              <p className="text-sm text-muted-foreground">Full keyboard navigation and clear focus indicators.</p>
          </Card>
      </div>
    </div>
  );
}
