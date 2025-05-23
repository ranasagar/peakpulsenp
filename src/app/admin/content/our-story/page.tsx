
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
import { Loader2, Save, BookOpenText } from 'lucide-react'; 
import type { OurStoryContentData } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const ourStoryContentSchema = z.object({
  heroTitle: z.string().min(5, "Hero title must be at least 5 characters.").optional().or(z.literal('')),
  heroDescription: z.string().min(10, "Hero description must be at least 10 characters.").optional().or(z.literal('')),
  missionTitle: z.string().min(5, "Mission title must be at least 5 characters.").optional().or(z.literal('')),
  missionParagraph1: z.string().min(10, "Mission paragraph 1 must be at least 10 characters.").optional().or(z.literal('')),
  missionParagraph2: z.string().min(10, "Mission paragraph 2 must be at least 10 characters.").optional().or(z.literal('')),
  craftsmanshipTitle: z.string().min(5, "Craftsmanship title must be at least 5 characters.").optional().or(z.literal('')),
  craftsmanshipParagraph1: z.string().min(10, "Craftsmanship paragraph 1 must be at least 10 characters.").optional().or(z.literal('')),
  craftsmanshipParagraph2: z.string().min(10, "Craftsmanship paragraph 2 must be at least 10 characters.").optional().or(z.literal('')),
  valuesSectionTitle: z.string().min(5, "Values section title must be at least 5 characters.").optional().or(z.literal('')),
  joinJourneySectionTitle: z.string().min(5, "Join Journey section title must be at least 5 characters.").optional().or(z.literal('')),
  joinJourneySectionDescription: z.string().min(10, "Join Journey section description must be at least 10 characters.").optional().or(z.literal('')),
});

type OurStoryContentFormValues = z.infer<typeof ourStoryContentSchema>;

const defaultOurStoryFormValues: OurStoryContentFormValues = {
  heroTitle: 'Our Story', heroDescription: 'Weaving together heritage and vision.',
  missionTitle: 'Our Mission', missionParagraph1: 'Elevating craftsmanship.', missionParagraph2: 'Connecting cultures.',
  craftsmanshipTitle: 'The Art of Creation', craftsmanshipParagraph1: 'Honoring traditions.', craftsmanshipParagraph2: 'Sourcing quality.',
  valuesSectionTitle: 'Our Values: Beyond the Seams',
  joinJourneySectionTitle: 'Join Our Journey', joinJourneySectionDescription: 'Follow us for updates.',
};

export default function AdminOurStoryContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OurStoryContentFormValues>({
    resolver: zodResolver(ourStoryContentSchema),
    defaultValues: defaultOurStoryFormValues,
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/content/our-story'); 
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch Our Story content');
        }
        const data: OurStoryContentData = await response.json();
        form.reset({
          heroTitle: data.hero?.title || '',
          heroDescription: data.hero?.description || '',
          missionTitle: data.mission?.title || '',
          missionParagraph1: data.mission?.paragraph1 || '',
          missionParagraph2: data.mission?.paragraph2 || '',
          craftsmanshipTitle: data.craftsmanship?.title || '',
          craftsmanshipParagraph1: data.craftsmanship?.paragraph1 || '',
          craftsmanshipParagraph2: data.craftsmanship?.paragraph2 || '',
          valuesSectionTitle: data.valuesSection?.title || '',
          joinJourneySectionTitle: data.joinJourneySection?.title || '',
          joinJourneySectionDescription: data.joinJourneySection?.description || '',
        });
      } catch (error) {
        console.error("Error fetching Our Story content:", error);
        toast({ title: "Error Loading Content", description: (error as Error).message + ". Displaying defaults.", variant: "destructive" });
        form.reset(defaultOurStoryFormValues);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (data: OurStoryContentFormValues) => {
    setIsSaving(true);
    try {
      const payload: OurStoryContentData = {
        hero: { title: data.heroTitle || '', description: data.heroDescription || '' },
        mission: { title: data.missionTitle || '', paragraph1: data.missionParagraph1 || '', paragraph2: data.missionParagraph2 || '' },
        craftsmanship: { title: data.craftsmanshipTitle || '', paragraph1: data.craftsmanshipParagraph1 || '', paragraph2: data.craftsmanshipParagraph2 || '' },
        valuesSection: { title: data.valuesSectionTitle || '' },
        joinJourneySection: { title: data.joinJourneySectionTitle || '', description: data.joinJourneySectionDescription || '' },
      };
      const response = await fetch('/api/admin/content/our-story', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to save Our Story content');
      }
      toast({ title: "Content Saved!", description: "Our Story page content has been updated." });
    } catch (error) {
      console.error("Error saving Our Story content:", error);
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><BookOpenText className="mr-3 h-6 w-6 text-primary"/>Edit Our Story Page Content</CardTitle>
          <CardDescription>Loading content...</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><BookOpenText className="mr-3 h-6 w-6 text-primary"/>Edit Our Story Page Content</CardTitle>
        <CardDescription>Modify text content for various sections. Data is saved to Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold text-foreground">Hero Section</h3>
                <FormField control={form.control} name="heroTitle" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="heroDescription" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold text-foreground">Mission Section</h3>
                <FormField control={form.control} name="missionTitle" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="missionParagraph1" render={({ field }) => (
                  <FormItem><FormLabel>Paragraph 1</FormLabel><FormControl><Textarea {...field} rows={4} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="missionParagraph2" render={({ field }) => (
                  <FormItem><FormLabel>Paragraph 2</FormLabel><FormControl><Textarea {...field} rows={4} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold text-foreground">Craftsmanship Section</h3>
                <FormField control={form.control} name="craftsmanshipTitle" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="craftsmanshipParagraph1" render={({ field }) => (
                  <FormItem><FormLabel>Paragraph 1</FormLabel><FormControl><Textarea {...field} rows={4} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="craftsmanshipParagraph2" render={({ field }) => (
                  <FormItem><FormLabel>Paragraph 2</FormLabel><FormControl><Textarea {...field} rows={4} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

             <div className="space-y-4 p-4 border rounded-md">
              <h3 className="text-lg font-semibold text-foreground">Values Section</h3>
              <FormField control={form.control} name="valuesSectionTitle" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="space-y-4 p-4 border rounded-md">
              <h3 className="text-lg font-semibold text-foreground">Join Our Journey Section</h3>
              <FormField control={form.control} name="joinJourneySectionTitle" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="joinJourneySectionDescription" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Our Story Content
            </Button>
          </form>
        </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

    