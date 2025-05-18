
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

interface OurStoryContentData {
  hero: {
    title: string;
    description: string;
  };
  mission: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  craftsmanship: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  valuesSection: {
    title: string;
  };
  joinJourneySection: {
    title: string;
    description: string;
  };
}

const ourStoryContentSchema = z.object({
  heroTitle: z.string().min(5, "Hero title must be at least 5 characters."),
  heroDescription: z.string().min(10, "Hero description must be at least 10 characters."),
  missionTitle: z.string().min(5, "Mission title must be at least 5 characters."),
  missionParagraph1: z.string().min(10, "Mission paragraph 1 must be at least 10 characters."),
  missionParagraph2: z.string().min(10, "Mission paragraph 2 must be at least 10 characters."),
  craftsmanshipTitle: z.string().min(5, "Craftsmanship title must be at least 5 characters."),
  craftsmanshipParagraph1: z.string().min(10, "Craftsmanship paragraph 1 must be at least 10 characters."),
  craftsmanshipParagraph2: z.string().min(10, "Craftsmanship paragraph 2 must be at least 10 characters."),
  valuesSectionTitle: z.string().min(5, "Values section title must be at least 5 characters."),
  joinJourneySectionTitle: z.string().min(5, "Join Journey section title must be at least 5 characters."),
  joinJourneySectionDescription: z.string().min(10, "Join Journey section description must be at least 10 characters."),
});

type OurStoryContentFormValues = z.infer<typeof ourStoryContentSchema>;

export default function AdminOurStoryContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OurStoryContentFormValues>({
    resolver: zodResolver(ourStoryContentSchema),
    defaultValues: {
      heroTitle: '', heroDescription: '',
      missionTitle: '', missionParagraph1: '', missionParagraph2: '',
      craftsmanshipTitle: '', craftsmanshipParagraph1: '', craftsmanshipParagraph2: '',
      valuesSectionTitle: '',
      joinJourneySectionTitle: '', joinJourneySectionDescription: '',
    },
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/content/our-story');
        if (!response.ok) throw new Error('Failed to fetch Our Story content');
        const data: OurStoryContentData = await response.json();
        form.reset({
          heroTitle: data.hero.title,
          heroDescription: data.hero.description,
          missionTitle: data.mission.title,
          missionParagraph1: data.mission.paragraph1,
          missionParagraph2: data.mission.paragraph2,
          craftsmanshipTitle: data.craftsmanship.title,
          craftsmanshipParagraph1: data.craftsmanship.paragraph1,
          craftsmanshipParagraph2: data.craftsmanship.paragraph2,
          valuesSectionTitle: data.valuesSection.title,
          joinJourneySectionTitle: data.joinJourneySection.title,
          joinJourneySectionDescription: data.joinJourneySection.description,
        });
      } catch (error) {
        console.error("Error fetching content:", error);
        toast({ title: "Error", description: (error as Error).message || "Could not load content.", variant: "destructive" });
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
        hero: { title: data.heroTitle, description: data.heroDescription },
        mission: { title: data.missionTitle, paragraph1: data.missionParagraph1, paragraph2: data.missionParagraph2 },
        craftsmanship: { title: data.craftsmanshipTitle, paragraph1: data.craftsmanshipParagraph1, paragraph2: data.craftsmanshipParagraph2 },
        valuesSection: { title: data.valuesSectionTitle },
        joinJourneySection: { title: data.joinJourneySectionTitle, description: data.joinJourneySectionDescription },
      };
      const response = await fetch('/api/admin/content/our-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save content');
      }
      toast({ title: "Content Saved!", description: "Our Story page content has been updated." });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Loading Our Story Content...</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Edit Our Story Page Content</CardTitle>
        <CardDescription>Modify the text content for various sections of the Our Story page.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Hero Section</legend>
              <FormField control={form.control} name="heroTitle" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="heroDescription" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Mission Section</legend>
              <FormField control={form.control} name="missionTitle" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="missionParagraph1" render={({ field }) => (
                <FormItem><FormLabel>Paragraph 1</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="missionParagraph2" render={({ field }) => (
                <FormItem><FormLabel>Paragraph 2</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
              )} />
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Craftsmanship Section</legend>
              <FormField control={form.control} name="craftsmanshipTitle" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="craftsmanshipParagraph1" render={({ field }) => (
                <FormItem><FormLabel>Paragraph 1</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="craftsmanshipParagraph2" render={({ field }) => (
                <FormItem><FormLabel>Paragraph 2</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
              )} />
            </fieldset>

             <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Values Section</legend>
              <FormField control={form.control} name="valuesSectionTitle" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Join Our Journey Section</legend>
              <FormField control={form.control} name="joinJourneySectionTitle" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="joinJourneySectionDescription" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />
            </fieldset>
            
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Our Story Content
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
