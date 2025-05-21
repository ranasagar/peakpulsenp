
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
import { Loader2, Save, Link as LinkIcon, PlusCircle, Trash2, Settings } from 'lucide-react';
import type { SiteSettings, SocialLink } from '@/types';

const socialLinkSchema = z.object({
  id: z.string().optional(), // For key prop in React
  platform: z.string().min(1, "Platform name is required."),
  url: z.string().url({ message: "Please enter a valid URL." }),
});

const siteSettingsSchema = z.object({
  siteTitle: z.string().min(3, "Site title must be at least 3 characters."),
  siteDescription: z.string().min(10, "Site description must be at least 10 characters."),
  storeEmail: z.string().email("Invalid email address."),
  storePhone: z.string().min(7, "Phone number seems too short.").optional().or(z.literal('')),
  storeAddress: z.string().min(5, "Address seems too short.").optional().or(z.literal('')),
  socialLinks: z.array(socialLinkSchema).optional(),
});

type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

const defaultSettings: SiteSettings = {
  siteTitle: "Peak Pulse",
  siteDescription: "Default description for Peak Pulse.",
  storeEmail: "contact@peakpulse.com",
  storePhone: "+977-XXX-XXXXXX",
  storeAddress: "Kathmandu, Nepal",
  socialLinks: [
    { platform: "Instagram", url: "https://instagram.com/peakpulsenp" },
    { platform: "Facebook", url: "https://facebook.com/peakpulse" },
  ]
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: async () => {
      // Fetch initial settings
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          console.warn("Failed to fetch current settings, using defaults.");
          return defaultSettings;
        }
        const data = await response.json();
        return {
          ...defaultSettings, // Start with defaults
          ...data, // Override with fetched data
          socialLinks: data.socialLinks ? data.socialLinks.map((link: any, index: number) => ({...link, id: `sl-${index}`})) : defaultSettings.socialLinks.map((link, index) => ({...link, id: `sl-default-${index}`})),
        };
      } catch (error) {
        console.error("Error fetching settings, using defaults:", error);
        return defaultSettings;
      }
    }
  });
  
  const { fields: socialLinksFields, append: appendSocialLink, remove: removeSocialLink } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  useEffect(() => {
    const fetchInitialSettings = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/settings');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                toast({ title: "Error", description: errorData.message || "Failed to load settings. Displaying defaults.", variant: "destructive" });
                form.reset(defaultSettings); // Reset with defaults on error
            } else {
                const data: SiteSettings = await response.json();
                form.reset({
                  ...data,
                  socialLinks: data.socialLinks ? data.socialLinks.map((link, index) => ({ ...link, id: `sl-${index}-${Date.now()}` })) : []
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not load settings. Displaying defaults.", variant: "destructive" });
            form.reset(defaultSettings); // Reset with defaults on error
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialSettings();
  }, [form, toast]);


  const onSubmit = async (data: SiteSettingsFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        socialLinks: data.socialLinks?.map(({ id, ...rest }) => rest) // Remove client-side id before sending
      };

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      toast({ title: "Settings Saved!", description: "Site settings have been updated successfully." });
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Settings className="mr-3 h-6 w-6 text-primary"/>General Site Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><Settings className="mr-3 h-6 w-6 text-primary"/>General Site Settings</CardTitle>
        <CardDescription>Manage core information and configurations for your website.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <fieldset className="space-y-4 p-4 border rounded-md bg-card">
              <legend className="text-lg font-semibold px-1 -mt-7 bg-card">Site Metadata</legend>
              <FormField control={form.control} name="siteTitle" render={({ field }) => (
                <FormItem><FormLabel>Site Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="siteDescription" render={({ field }) => (
                <FormItem><FormLabel>Site Description (for SEO)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md bg-card">
              <legend className="text-lg font-semibold px-1 -mt-7 bg-card">Store Contact Information</legend>
              <FormField control={form.control} name="storeEmail" render={({ field }) => (
                <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="storePhone" render={({ field }) => (
                <FormItem><FormLabel>Contact Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="storeAddress" render={({ field }) => (
                <FormItem><FormLabel>Store Address (Optional)</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md bg-card">
              <legend className="text-lg font-semibold px-1 -mt-7 bg-card">Social Media Links</legend>
              {socialLinksFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md bg-muted/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <FormField control={form.control} name={`socialLinks.${index}.platform`} render={({ field }) => (
                      <FormItem><FormLabel>Platform Name (e.g., Instagram)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`socialLinks.${index}.url`} render={({ field }) => (
                      <FormItem><FormLabel>Full URL</FormLabel><FormControl><Input {...field} placeholder="https://instagram.com/yourprofile" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeSocialLink(index)}><Trash2 className="mr-1.5 h-4 w-4"/>Remove Link</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendSocialLink({ id: `new-${Date.now()}`, platform: '', url: '' })}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add Social Link
              </Button>
            </fieldset>
            
            <Button type="submit" disabled={isSaving} size="lg" className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

