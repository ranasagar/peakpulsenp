
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Link as LinkIcon, PlusCircle, Trash2, Settings, MessageCircle, Image as ImageIconLucide } from 'lucide-react';
import type { SiteSettings, SocialLink } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


// Schema for general settings
const siteGeneralSettingsSchema = z.object({
  siteTitle: z.string().min(3, "Site title must be at least 3 characters.").default("Peak Pulse"),
  siteDescription: z.string().min(10, "Site description must be at least 10 characters.").default("Discover Peak Pulse..."),
  headerLogoUrl: z.string().url({ message: "Must be a valid URL for the header logo." }).optional().or(z.literal('')),
  headerSiteTitle: z.string().min(1, "Header site title cannot be empty if set.").optional().or(z.literal('')),
  storeEmail: z.string().email("Invalid email address.").default("contact@example.com"),
  storePhone: z.string().optional().or(z.literal('')).default(""),
  storeAddress: z.string().optional().or(z.literal('')).default(""),
  socialLinks: z.array(z.object({
    id: z.string().optional(),
    platform: z.string(),
    url: z.string().url(),
  })).optional().default([]),
  showExternalLinkWarning: z.boolean().optional().default(true),
  whatsappNumber: z.string().optional().or(z.literal('')).default("9862020757"),
  instagramUsername: z.string().optional().or(z.literal('')).default("peakpulsenp"),
  facebookUsernameOrPageId: z.string().optional().or(z.literal('')).default("peakpulsenp"),
});

type SiteGeneralSettingsFormValues = z.infer<typeof siteGeneralSettingsSchema>;

const defaultGeneralSettings: SiteGeneralSettingsFormValues = {
  siteTitle: "Peak Pulse",
  siteDescription: "Default description for Peak Pulse. Discover unique apparel where Nepali heritage meets contemporary design.",
  headerLogoUrl: '',
  headerSiteTitle: 'Peak Pulse',
  storeEmail: "contact@peakpulse.com",
  storePhone: "+977-XXX-XXXXXX",
  storeAddress: "Kathmandu, Nepal",
  socialLinks: [],
  showExternalLinkWarning: true,
  whatsappNumber: "9862020757",
  instagramUsername: "peakpulsenp",
  facebookUsernameOrPageId: "peakpulsenp",
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
            const response = await fetch('/api/admin/settings'); 
            if (!response.ok) {
                let errorDetail = 'Failed to fetch site settings from Supabase.';
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server error ${response.status}`;
                } catch (e) { /* ignore if not json */ }
                throw new Error(errorDetail);
            }
            const data: SiteSettings = await response.json();
            form.reset({ 
                siteTitle: data.siteTitle || defaultGeneralSettings.siteTitle,
                siteDescription: data.siteDescription || defaultGeneralSettings.siteDescription,
                headerLogoUrl: data.headerLogoUrl || defaultGeneralSettings.headerLogoUrl,
                headerSiteTitle: data.headerSiteTitle || defaultGeneralSettings.headerSiteTitle,
                storeEmail: data.storeEmail || defaultGeneralSettings.storeEmail,
                storePhone: data.storePhone || defaultGeneralSettings.storePhone,
                storeAddress: data.storeAddress || defaultGeneralSettings.storeAddress,
                socialLinks: data.socialLinks || [],
                showExternalLinkWarning: data.showExternalLinkWarning === undefined ? defaultGeneralSettings.showExternalLinkWarning : data.showExternalLinkWarning,
                whatsappNumber: data.whatsappNumber || defaultGeneralSettings.whatsappNumber,
                instagramUsername: data.instagramUsername || defaultGeneralSettings.instagramUsername,
                facebookUsernameOrPageId: data.facebookUsernameOrPageId || defaultGeneralSettings.facebookUsernameOrPageId,
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
      const payload: SiteSettings = { 
        siteTitle: data.siteTitle,
        siteDescription: data.siteDescription,
        headerLogoUrl: data.headerLogoUrl || undefined,
        headerSiteTitle: data.headerSiteTitle || undefined,
        storeEmail: data.storeEmail,
        storePhone: data.storePhone,
        storeAddress: data.storeAddress,
        socialLinks: data.socialLinks || [],
        showExternalLinkWarning: data.showExternalLinkWarning,
        whatsappNumber: data.whatsappNumber,
        instagramUsername: data.instagramUsername,
        facebookUsernameOrPageId: data.facebookUsernameOrPageId,
      }; 

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = 'Failed to save settings to Supabase.';
         try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server error ${response.status}`;
        } catch (e) { /* ignore */ }
        throw new Error(errorDetail);
      }
      toast({ title: "Settings Saved!", description: "General site settings have been updated successfully." });
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><Settings className="mr-3 h-6 w-6 text-primary"/>General Site Settings</CardTitle>
        <CardDescription>Manage core information for your website. Social media links are managed under "Content Management &gt; Footer".</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
            <div className="flex-grow flex justify-center items-center py-10 h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-2">Loading settings...</p>
            </div>
        ) : (
        <ScrollArea className="h-full p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={['header-appearance', 'site-metadata', 'store-contact', 'social-messaging', 'ux-settings']} className="w-full">
              <AccordionItem value="header-appearance">
                <AccordionTrigger className="text-xl font-semibold">Header Appearance</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <FormField control={form.control} name="headerLogoUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-muted-foreground" /> Header Logo URL (Optional)</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="https://example.com/your-logo.png" /></FormControl>
                      <FormDescription>If empty, the default site icon will be used. Recommended size: 120x40 pixels.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="headerSiteTitle" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Site Title (Optional)</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="e.g., Peak Pulse Nepal" /></FormControl>
                      <FormDescription>If empty, the general Site Title will be used or a default. Keep it short. HTML is allowed for rich text (e.g., Peak &lt;strong&gt;Pulse&lt;/strong&gt;).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="site-metadata">
                <AccordionTrigger className="text-xl font-semibold">Site Metadata</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <FormField control={form.control} name="siteTitle" render={({ field }) => (
                    <FormItem><FormLabel>Site Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="siteDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Description (for SEO)</FormLabel>
                      <FormControl><Textarea {...field} rows={3} value={field.value || ''} /></FormControl>
                      <FormDescription>This description is used for search engine results. Keep it concise (around 150-160 characters) and use plain text.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="store-contact">
                <AccordionTrigger className="text-xl font-semibold">Store Contact Information</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <FormField control={form.control} name="storeEmail" render={({ field }) => (
                    <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="storePhone" render={({ field }) => (
                    <FormItem><FormLabel>Contact Phone (Optional)</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="storeAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Address (Optional)</FormLabel>
                      <FormControl><Textarea {...field} rows={2} value={field.value || ''}/></FormControl>
                      <FormDescription>Use '\n' for line breaks if needed (e.g., "Street Address\nCity, Country"). Avoid HTML here.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="social-messaging">
                <AccordionTrigger className="text-xl font-semibold flex items-center"><MessageCircle className="mr-2 h-5 w-5 text-primary"/>Social Messaging Links</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <FormDescription>
                    Used for the floating social messaging widget. Enter only the username or ID, not the full URL.
                  </FormDescription>
                  <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                    <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g., 97798XXXXXXXX" /></FormControl><FormDescription>Your WhatsApp phone number, including country code if applicable (e.g., 9779862020757). The widget will format the link: <code>https://wa.me/YOUR_NUMBER</code>.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="instagramUsername" render={({ field }) => (
                    <FormItem><FormLabel>Instagram Username</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g., peakpulsenp" /></FormControl><FormDescription>Your Instagram username (e.g., <code>peakpulsenp</code>), not the full profile URL. The widget will create the DM link: <code>https://ig.me/m/YOUR_USERNAME</code>.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="facebookUsernameOrPageId" render={({ field }) => (
                    <FormItem><FormLabel>Facebook Page Username or Page ID</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g., peakpulsenp or 1000XXXXXXXXX" /></FormControl><FormDescription>Your Facebook Page's username (e.g., <code>peakpulsenp</code>) or its numeric Page ID. The widget will create the Messenger link: <code>https://m.me/YOUR_ID</code>. Ensure your Page's messaging settings allow direct messages.</FormDescription><FormMessage /></FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ux-settings">
                <AccordionTrigger className="text-xl font-semibold">User Experience</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="showExternalLinkWarning"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel>External Link Warning</FormLabel>
                            <FormDescription>
                              Show a confirmation popup before navigating to external websites.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Button type="submit" disabled={isSaving || isLoading} size="lg" className="w-full sm:w-auto !mt-8">
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Settings
            </Button>
          </form>
        </Form>
        </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

