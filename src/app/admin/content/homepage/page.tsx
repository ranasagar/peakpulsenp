
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface HomepageContentData {
  hero: {
    title: string;
    description: string;
  };
  artisanalRoots?: {
    title: string;
    description: string;
  };
}

const homepageContentSchema = z.object({
  heroTitle: z.string().min(5, "Hero title must be at least 5 characters."),
  heroDescription: z.string().min(10, "Hero description must be at least 10 characters."),
  artisanalRootsTitle: z.string().min(5, "Artisanal roots title must be at least 5 characters.").optional(),
  artisanalRootsDescription: z.string().min(10, "Artisanal roots description must be at least 10 characters.").optional(),
});

type HomepageContentFormValues = z.infer<typeof homepageContentSchema>;

export default function AdminHomepageContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HomepageContentFormValues>({
    resolver: zodResolver(homepageContentSchema),
    defaultValues: {
      heroTitle: '',
      heroDescription: '',
      artisanalRootsTitle: '',
      artisanalRootsDescription: '',
    },
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/content/homepage');
        if (!response.ok) {
          throw new Error('Failed to fetch homepage content');
        }
        const data: HomepageContentData = await response.json();
        form.reset({
          heroTitle: data.hero.title,
          heroDescription: data.hero.description,
          artisanalRootsTitle: data.artisanalRoots?.title || '',
          artisanalRootsDescription: data.artisanalRoots?.description || '',
        });
      } catch (error) {
        console.error("Error fetching content:", error);
        toast({
          title: "Error",
          description: (error as Error).message || "Could not load content.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (data: HomepageContentFormValues) => {
    setIsSaving(true);
    try {
      const payload: HomepageContentData = {
        hero: {
          title: data.heroTitle,
          description: data.heroDescription,
        },
        artisanalRoots: {
          title: data.artisanalRootsTitle || '',
          description: data.artisanalRootsDescription || '',
        }
      };

      const response = await fetch('/api/admin/content/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save content');
      }

      toast({
        title: "Content Saved!",
        description: "Homepage content has been updated.",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Save Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Loading Content...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Edit Homepage Content</CardTitle>
        <CardDescription>
          Modify the text displayed in the hero section and other areas of the homepage.
          <br />
          <strong className="text-destructive">Note:</strong> Saving changes here directly modifies a JSON file in the project. This method is for demonstration and has limitations in production environments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Hero Section</legend>
              <FormField
                control={form.control}
                name="heroTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter hero title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heroDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter hero description" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Artisanal Roots Section</legend>
              <FormField
                control={form.control}
                name="artisanalRootsTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artisanal Roots Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title for artisanal roots section" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="artisanalRootsDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artisanal Roots Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description for artisanal roots section" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
            
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Content
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
