
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Link as LinkIcon, PlusCircle, Trash2, Settings } from 'lucide-react';
import type { SiteSettings, SocialLink } from '@/types'; // SocialLink is part of Footer now.

// Schema for general settings (excluding social links as they are part of footer content now)
const siteGeneralSettingsSchema = z.object({
  siteTitle: z.string().min(3, "Site title must be at least 3 characters."),
  siteDescription: z.string().min(10, "Site description must be at least 10 characters."),
  storeEmail: z.string().email("Invalid email address."),
  storePhone: z.string().min(7, "Phone number seems too short.").optional().or(z.literal('')),
  storeAddress: z.string().min(5, "Address seems too short.").optional().or(z.literal('')),
});

type SiteGeneralSettingsFormValues = z.infer<typeof siteGeneralSettingsSchema>;

// Default values for the form if nothing is fetched from Supabase
const defaultGeneralSettings: SiteGeneralSettingsFormValues = {
  siteTitle: "Peak Pulse",
  siteDescription: "Default description for Peak Pulse. Discover unique apparel where Nepali heritage meets contemporary design.",
  storeEmail: "contact@peakpulse.com",
  storePhone: "+977-XXX-XXXXXX",
  storeAddress: "Kathmandu, Nepal",
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SiteGeneralSettingsFormValues>({
    resolver: zodResolver(siteGeneralSettingsSchema),
    defaultValues: defaultGeneralSettings,
  });
  
  useEffect(() => {
    const fetchInitialSettings = async () => {
        setIsLoading(true);
        try {
            // API fetches from 'siteGeneralSettings' key in Supabase
            const response = await fetch('/api/admin/settings'); 
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch site settings from Supabase');
            }
            const data: SiteSettings = await response.json(); // API returns full SiteSettings type
            form.reset({ // Reset form with fetched data
                siteTitle: data.siteTitle || defaultGeneralSettings.siteTitle,
                siteDescription: data.siteDescription || defaultGeneralSettings.siteDescription,
                storeEmail: data.storeEmail || defaultGeneralSettings.storeEmail,
                storePhone: data.storePhone || defaultGeneralSettings.storePhone,
                storeAddress: data.storeAddress || defaultGeneralSettings.storeAddress,
            });
        } catch (error) {
            toast({ title: "Error Loading Settings", description: (error as Error).message + ". Displaying defaults.", variant: "destructive" });
            form.reset(defaultGeneralSettings);
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialSettings();
  }, [form, toast]);


  const onSubmit = async (data: SiteGeneralSettingsFormValues) => {
    setIsSaving(true);
    try {
      // Payload matches the form values, socialLinks are handled separately via Footer admin
      const payload: Partial<SiteSettings> = { ...data }; 

      const response = await fetch('/api/admin/settings', { // POSTs to 'siteGeneralSettings' key
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings to Supabase');
      }
      toast({ title: "Settings Saved!", description: "General site settings have been updated successfully." });
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
        <CardDescription>Manage core information for your website. Social media links are managed under "Footer Content".</CardDescription>
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
