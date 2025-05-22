
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Youtube, Image as ImageIcon, PlusCircle, Trash2, Package, Tv, BookOpen } from 'lucide-react';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const heroSlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Slide title must be at least 3 characters.").optional().or(z.literal('')),
  description: z.string().min(5, "Slide description must be at least 5 characters.").optional().or(z.literal('')),
  videoId: z.string().optional().refine(val => !val || /^[a-zA-Z0-9_-]{11}$/.test(val), {
    message: "Must be a valid YouTube Video ID (11 characters) or empty.",
  }).or(z.literal('')),
  imageUrl: z.string().url({ message: "Must be a valid URL or empty." }).optional().or(z.literal('')),
  altText: z.string().optional().or(z.literal('')),
  dataAiHint: z.string().optional().or(z.literal('')),
  ctaText: z.string().optional().or(z.literal('')),
  ctaLink: z.string().optional().refine(val => !val || val.startsWith('/') || val.startsWith('http'), {
    message: "CTA link must be a relative path (e.g., /products) or a full URL."
  }).or(z.literal('')),
});

const socialCommerceItemSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url("Image URL is required.").min(1, "Image URL cannot be empty."),
  linkUrl: z.string().url("Link URL to Instagram post is required.").min(1, "Link URL cannot be empty."),
  altText: z.string().optional().or(z.literal('')),
  dataAiHint: z.string().optional().or(z.literal('')),
});

const homepageContentSchema = z.object({
  heroSlides: z.array(heroSlideSchema).min(0).optional(),
  artisanalRootsTitle: z.string().min(3, "Artisanal roots title is required.").optional().or(z.literal('')),
  artisanalRootsDescription: z.string().min(5, "Artisanal roots description is required.").optional().or(z.literal('')),
  socialCommerceItems: z.array(socialCommerceItemSchema).optional(),
  heroVideoId: z.string().optional().refine(val => !val || /^[a-zA-Z0-9_-]{11}$/.test(val), {
    message: "Must be a valid YouTube Video ID (11 characters) or empty.",
  }).or(z.literal('')),
  heroImageUrl: z.string().url({ message: "Must be a valid URL or empty." }).optional().or(z.literal('')),
});

type HomepageContentFormValues = z.infer<typeof homepageContentSchema>;

const defaultHeroSlide: HeroSlide = {
  id: '', title: 'New Slide Title', description: 'Compelling description for the new slide.', videoId: '', imageUrl: '', altText: 'Hero slide image', dataAiHint: 'fashion background', ctaText: 'Shop Now', ctaLink: '/products'
};

const defaultSocialCommerceItem: SocialCommerceItem = {
  id: '', imageUrl: '', linkUrl: 'https://instagram.com/peakpulsenp', altText: 'Peak Pulse Style', dataAiHint: 'fashion instagram user'
};

const defaultHomepageFormValues: HomepageContentFormValues = {
  heroSlides: [{ ...defaultHeroSlide, id: `slide-initial-${Date.now()}` }],
  artisanalRootsTitle: 'Our Artisanal Roots',
  artisanalRootsDescription: 'Discover the heritage and craftsmanship woven into every Peak Pulse piece.',
  socialCommerceItems: [],
  heroVideoId: '',
  heroImageUrl: '',
};

export default function AdminHomepageContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HomepageContentFormValues>({
    resolver: zodResolver(homepageContentSchema),
    defaultValues: defaultHomepageFormValues,
  });

  const { fields: heroSlidesFields, append: appendHeroSlide, remove: removeHeroSlide } = useFieldArray({
    control: form.control,
    name: "heroSlides",
  });

  const { fields: socialCommerceFields, append: appendSocialCommerceItem, remove: removeSocialCommerceItem } = useFieldArray({
    control: form.control,
    name: "socialCommerceItems",
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/content/homepage'); 
        if (!response.ok) {
          let errorDetail = 'Failed to fetch homepage content';
          try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server responded with ${response.status}: ${response.statusText}`;
          } catch (jsonError) {
            errorDetail = `Server responded with ${response.status}: ${response.statusText} (and response was not valid JSON).`;
          }
          throw new Error(errorDetail);
        }
        const data: HomepageContent = await response.json();
        form.reset({
          heroSlides: (data.heroSlides && data.heroSlides.length > 0 
            ? data.heroSlides.map(slide => ({ ...defaultHeroSlide, ...slide, id: slide.id || `hs-loaded-${Date.now()}-${Math.random()}` })) 
            : [{ ...defaultHeroSlide, id: `hs-empty-${Date.now()}` }]),
          artisanalRootsTitle: data.artisanalRoots?.title || defaultHomepageFormValues.artisanalRootsTitle,
          artisanalRootsDescription: data.artisanalRoots?.description || defaultHomepageFormValues.artisanalRootsDescription,
          socialCommerceItems: (data.socialCommerceItems && data.socialCommerceItems.length > 0
            ? data.socialCommerceItems.map(item => ({ ...defaultSocialCommerceItem, ...item, id: item.id || `sc-loaded-${Date.now()}-${Math.random()}` })) 
            : []),
          heroVideoId: data.heroVideoId || defaultHomepageFormValues.heroVideoId,
          heroImageUrl: data.heroImageUrl || defaultHomepageFormValues.heroImageUrl,
        });
      } catch (error) {
        console.error("Error fetching homepage content:", error);
        toast({ title: "Error Loading Content", description: (error as Error).message + ". Displaying defaults.", variant: "destructive" });
        form.reset(defaultHomepageFormValues);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (data: HomepageContentFormValues) => {
    setIsSaving(true);
    try {
      const payload: HomepageContent = {
        heroSlides: (data.heroSlides || []).map(slide => ({
          ...slide,
          id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          videoId: slide.videoId || undefined,
          imageUrl: slide.imageUrl || undefined,
        })),
        artisanalRoots: {
          title: data.artisanalRootsTitle || '',
          description: data.artisanalRootsDescription || '',
        },
        socialCommerceItems: (data.socialCommerceItems || []).map(item => ({
          ...item,
          id: item.id || `social-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
        })),
        heroVideoId: data.heroVideoId || undefined,
        heroImageUrl: data.heroImageUrl || undefined,
      };

      const response = await fetch('/api/admin/content/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = 'Failed to save homepage content';
        try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server responded with ${response.status}: ${response.statusText}`;
        } catch (jsonError) {
            try {
                const textError = await response.text();
                errorDetail = `Server responded with ${response.status}: ${textError.substring(0,200)}`;
            } catch (textFallbackError){
                errorDetail = `Server responded with ${response.status}: ${response.statusText} (response body not readable)`;
            }
        }
        throw new Error(errorDetail);
      }

      toast({ title: "Content Saved!", description: "Homepage content has been updated successfully." });
    } catch (error) {
      console.error("Error saving homepage content:", error);
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg flex flex-col h-full"> {/* h-full to use parent height */}
        <CardHeader><CardTitle className="text-2xl flex items-center"><Tv className="mr-3 h-6 w-6 text-primary"/>Edit Homepage Content</CardTitle><CardDescription>Loading content...</CardDescription></CardHeader>
        <CardContent className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg flex flex-col h-full"> {/* Apply flex flex-col h-full */}
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><Tv className="mr-3 h-6 w-6 text-primary"/>Edit Homepage Content</CardTitle>
        <CardDescription>Modify text and media for various sections. Data is saved to Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0"> {/* flex-grow and overflow-hidden */}
        <ScrollArea className="h-full p-6"> {/* ScrollArea takes full height of CardContent, p-6 applied here */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-foreground flex items-center">
                  <ImageIcon className="mr-3 h-5 w-5 text-primary" /> Hero Section Carousel Slides
                </h3>
                <ScrollArea className="max-h-96 p-1 -m-1">
                  <div className="space-y-4 p-1">
                    {heroSlidesFields.map((field, index) => (
                      <Card key={field.id} className="p-4 space-y-3 bg-muted/30">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-lg text-foreground">Slide {index + 1}</h4>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeHeroSlide(index)} disabled={heroSlidesFields.length <= 0 && !(form.getValues('heroVideoId') || form.getValues('heroImageUrl'))}>
                            <Trash2 className="mr-1 h-4 w-4" /> Remove Slide
                          </Button>
                        </div>
                        <FormField control={form.control} name={`heroSlides.${index}.title`} render={({ field }) => (
                          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., New Collection Arrived" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`heroSlides.${index}.description`} render={({ field }) => (
                          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="e.g., Discover fresh styles..."/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`heroSlides.${index}.imageUrl`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/> Background Image URL</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. https://example.com/hero-image.jpg" /></FormControl>
                            <FormDescription>Tip: For quick uploads, try free sites like ImgBB.com or Postimages.org. Upload your image, then copy and paste the "Direct link" here.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`heroSlides.${index}.altText`} render={({ field }) => (
                          <FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} placeholder="Describe the image for accessibility"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`heroSlides.${index}.dataAiHint`} render={({ field }) => (
                          <FormItem><FormLabel>Image AI Hint (for placeholder)</FormLabel><FormControl><Input {...field} placeholder="e.g., fashion model mountains"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`heroSlides.${index}.videoId`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center"><Youtube className="mr-2 h-4 w-4 text-muted-foreground"/> YouTube Video ID (Overrides Image)</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. gCRNEJxDJKM (11 characters)" /></FormControl>
                            <FormDescription>The 11-character ID from a YouTube video URL (e.g., the XXXXXXXXXXX in youtu.be/XXXXXXXXXXX).</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`heroSlides.${index}.ctaText`} render={({ field }) => (
                          <FormItem><FormLabel>CTA Button Text</FormLabel><FormControl><Input {...field} placeholder="e.g., Shop Now"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`heroSlides.${index}.ctaLink`} render={({ field }) => (
                          <FormItem><FormLabel>CTA Button Link</FormLabel><FormControl><Input {...field} placeholder="/products or https://example.com" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <Button type="button" variant="outline" size="sm" onClick={() => appendHeroSlide({ ...defaultHeroSlide, id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Hero Slide
                </Button>
                <p className="text-xs text-muted-foreground pt-2">
                  Note: If you provide a YouTube Video ID for a slide, it will be used instead of the Image URL for that slide's background. The Standalone Hero Backgrounds below are used if NO slides are active or if the carousel fails.
                </p>
              </div>

              <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-foreground flex items-center">
                   <ImageIcon className="mr-3 h-5 w-5 text-primary" /> Standalone Hero Background (Fallback)
                </h3>
                <p className="text-sm text-muted-foreground">Used if no carousel slides are active/defined, or as an ultimate fallback if the carousel fails. Video ID takes precedence over Image URL.</p>
                <FormField control={form.control} name="heroImageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/> Standalone Hero Background Image URL</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. https://example.com/main-hero-image.jpg" /></FormControl>
                    <FormDescription>Tip: For quick uploads, try free sites like ImgBB.com or Postimages.org. Upload your image, then copy and paste the "Direct link" here.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroVideoId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Youtube className="mr-2 h-4 w-4 text-muted-foreground"/> Standalone Hero YouTube Video ID (Overrides Image)</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. gCRNEJxDJKM (11 characters)" /></FormControl>
                    <FormDescription>The 11-character ID from a YouTube video URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-foreground flex items-center">
                  <BookOpen className="mr-3 h-5 w-5 text-primary" /> Artisanal Roots Section
                </h3>
                <FormField control={form.control} name="artisanalRootsTitle" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Enter title" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="artisanalRootsDescription" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter description" {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-foreground flex items-center">
                  <Package className="mr-3 h-5 w-5 text-primary" /> Social Commerce Section (#PeakPulseStyle)
                </h3>
                <ScrollArea className="max-h-96 p-1 -m-1"> 
                  <div className="space-y-4 p-1">
                    {socialCommerceFields.map((field, index) => (
                      <Card key={field.id} className="p-4 space-y-3 bg-muted/30">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-lg text-foreground">Instagram Post {index + 1}</h4>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeSocialCommerceItem(index)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Remove Post
                          </Button>
                        </div>
                        <FormField control={form.control} name={`socialCommerceItems.${index}.imageUrl`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL*</FormLabel>
                            <FormControl><Input {...field} placeholder="https://example.com/insta-image.jpg" /></FormControl>
                            <FormDescription>Tip: For quick uploads, try free sites like ImgBB.com or Postimages.org. Upload your image, then copy and paste the "Direct link" here.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`socialCommerceItems.${index}.linkUrl`} render={({ field }) => (
                          <FormItem><FormLabel>Link to Instagram Post*</FormLabel><FormControl><Input {...field} placeholder="https://instagram.com/p/yourpostid" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`socialCommerceItems.${index}.altText`} render={({ field }) => (
                          <FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} placeholder="Describe the image"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`socialCommerceItems.${index}.dataAiHint`} render={({ field }) => (
                          <FormItem><FormLabel>Image AI Hint (for placeholder)</FormLabel><FormControl><Input {...field} placeholder="e.g. instagram fashion user" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSocialCommerceItem({ ...defaultSocialCommerceItem, id: `social-${Date.now()}-${Math.random().toString(36).substr(2,5)}`})} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Instagram Post Item
                </Button>
              </div>
              
              <Button type="submit" disabled={isSaving || isLoading} className="w-full sm:w-auto !mt-8" size="lg"> 
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Save Homepage Content
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
