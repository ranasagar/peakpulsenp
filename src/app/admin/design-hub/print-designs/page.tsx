
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, Edit, ImageIcon as ImageIconLucide, Printer } from 'lucide-react';
import type { PrintOnDemandDesign, DesignCollaborationGallery } from '@/types';
import {
  Dialog, DialogContent, DialogDescription as DialogFormDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent as AlertDialogDeleteContent,
  AlertDialogDescription as AlertDialogDeleteDescription, AlertDialogFooter as AlertDialogDeleteFooter,
  AlertDialogHeader as AlertDialogDeleteHeader, AlertDialogTitle as AlertDialogDeleteTitle
} from "@/components/ui/alert-dialog";

const printDesignSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens.").optional().or(z.literal('')),
  description: z.string().optional(),
  image_url: z.string().url({ message: "Valid image URL is required." }).min(1, "Image URL cannot be empty."),
  ai_image_prompt: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative."),
  is_for_sale: z.boolean().default(true),
  sku: z.string().optional(),
  collaboration_id: z.string().nullable().optional(),
});

type PrintDesignFormValues = z.infer<typeof printDesignSchema>;

const NO_COLLABORATION_ID_VALUE = "__NONE_COLLAB__"; // Special value for "None" option

export default function AdminPrintOnDemandDesignsPage() {
  const { toast } = useToast();
  const [designs, setDesigns] = useState<PrintOnDemandDesign[]>([]);
  const [collaborations, setCollaborations] = useState<DesignCollaborationGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDesign, setEditingDesign] = useState<PrintOnDemandDesign | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<PrintOnDemandDesign | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const form = useForm<PrintDesignFormValues>({
    resolver: zodResolver(printDesignSchema),
    defaultValues: {
      title: '', slug: '', description: '', image_url: '', ai_image_prompt: '',
      price: 0, is_for_sale: true, sku: '', collaboration_id: null,
    },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [designsRes, collabsRes] = await Promise.all([
        fetch('/api/admin/print-on-demand-designs'),
        fetch('/api/admin/design-collaborations') // Fetch all collaborations for the dropdown
      ]);
      if (!designsRes.ok) {
        const errorData = await designsRes.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch print designs');
      }
      if (!collabsRes.ok) {
        const errorData = await collabsRes.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch design collaborations');
      }

      const designsData: PrintOnDemandDesign[] = await designsRes.json();
      const collabsData: DesignCollaborationGallery[] = await collabsRes.json();

      setDesigns(designsData);
      setCollaborations(collabsData);
    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (design: PrintOnDemandDesign) => {
    setEditingDesign(design);
    form.reset({
      ...design,
      collaboration_id: design.collaboration_id || null,
      slug: design.slug || '', // Ensure slug is empty string if null/undefined for form
      description: design.description || '',
      ai_image_prompt: design.ai_image_prompt || '',
      sku: design.sku || '',
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingDesign(null);
    form.reset({
      title: '', slug: '', description: '', image_url: '', ai_image_prompt: '',
      price: 0, is_for_sale: true, sku: '', collaboration_id: null,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: PrintDesignFormValues) => {
    setIsSaving(true);
    const method = editingDesign ? 'PUT' : 'POST';
    const url = editingDesign ? `/api/admin/print-on-demand-designs/${editingDesign.id}` : '/api/admin/print-on-demand-designs';
    const payload = {
      ...data,
      slug: data.slug?.trim() || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      collaboration_id: data.collaboration_id === NO_COLLABORATION_ID_VALUE ? null : data.collaboration_id,
    };

    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save and parse error' }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to ${editingDesign ? 'update' : 'create'} print design`);
      }
      toast({ title: "Success!", description: `Print design "${payload.title}" ${editingDesign ? 'updated' : 'created'}.` });
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!designToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/print-on-demand-designs/${designToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete and parse error' }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to delete print design');
      }
      toast({ title: "Print Design Deleted", description: `"${designToDelete.title}" deleted.` });
      fetchData();
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsDeleteAlertOpen(false);
      setDesignToDelete(null);
    }
  };

  const getCollaborationTitle = (collabId?: string | null) => {
    if (!collabId) return 'N/A';
    return collaborations.find(c => c.id === collabId)?.title || 'Unknown';
  };

  if (isLoading) {
     return (
      <Card className="shadow-lg flex flex-col h-full">
        <CardHeader><CardTitle className="text-2xl flex items-center"><Printer className="mr-3 h-6 w-6 text-primary"/>Manage Print-on-Demand Designs</CardTitle><CardDescription>Loading designs...</CardDescription></CardHeader>
        <CardContent className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Printer className="mr-3 h-6 w-6 text-primary"/>Manage Print-on-Demand Designs</CardTitle>
            <CardDescription>Create, edit, and manage designs available for print-on-demand customization on products.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> Add New Design</Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            {designs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No print designs found. Add one to get started.</p>
            ) : (
              <div className="space-y-4">
                {designs.map(design => (
                  <Card key={design.id} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 flex-grow">
                      <Image src={design.image_url} alt={design.title} width={60} height={60} className="rounded-md object-cover aspect-square bg-muted" data-ai-hint={design.ai_image_prompt || 'design print art'} />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-foreground">{design.title} <span className="text-xs text-muted-foreground">({design.slug})</span></h3>
                        <p className="text-sm text-muted-foreground">Price: रू{design.price.toLocaleString()} | SKU: {design.sku || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">For Sale: {design.is_for_sale ? 'Yes' : 'No'} | Collaboration: {getCollaborationTitle(design.collaboration_id)}</p>
                      </div>
                    </div>
                     <div className="flex space-x-2 flex-shrink-0 pt-2 sm:pt-0">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(design)}><Edit className="mr-1.5 h-3 w-3" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => { setDesignToDelete(design); setIsDeleteAlertOpen(true); }}>
                        <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) form.reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDesign ? 'Edit Print Design' : 'Add New Print Design'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Title*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="slug" render={({ field }) => (
                        <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} placeholder="auto-generated if empty" /></FormControl><FormDescription>Lowercase, hyphens only.</FormDescription><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="image_url" render={({ field }) => (
                    <FormItem><FormLabel>Image URL*</FormLabel><FormControl><Input {...field} placeholder="https://example.com/design.png" /></FormControl>
                    <FormDescription>Tip: Use services like ImgBB.com or Postimages.org for free uploads. Paste the "Direct link".</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ai_image_prompt" render={({ field }) => (
                    <FormItem><FormLabel>AI Image Prompt</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="Prompt used for image generation" /></FormControl><FormMessage /></FormItem>
                )} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>Price (NPR)*</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="sku" render={({ field }) => (
                        <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="collaboration_id" render={({ field }) => (
                    <FormItem><FormLabel>Related Collaboration (Optional)</FormLabel>
                        <Select
                            onValueChange={(value) => field.onChange(value === NO_COLLABORATION_ID_VALUE ? null : value)}
                            value={field.value === null || field.value === undefined ? NO_COLLABORATION_ID_VALUE : field.value}
                        >
                        <FormControl><SelectTrigger><SelectValue placeholder="Link to a design collaboration" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value={NO_COLLABORATION_ID_VALUE}>None</SelectItem>
                            {collaborations.map(collab => <SelectItem key={collab.id} value={collab.id}>{collab.title}</SelectItem>)}
                        </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="is_for_sale" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal mb-0! pt-0!">Available for Sale</FormLabel>
                    </FormItem>
                )} />
                <DialogFooter className="pt-4">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingDesign ? 'Save Changes' : 'Create Design'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if (!open) setDesignToDelete(null); setIsDeleteAlertOpen(open);}}>
        <AlertDialogDeleteContent>
          <AlertDialogDeleteHeader>
            <AlertDialogDeleteTitle>Are you sure?</AlertDialogDeleteTitle>
            <AlertDialogDeleteDescription>
              This will permanently delete the print design "{designToDelete?.title}". This action cannot be undone.
            </AlertDialogDeleteDescription>
          </AlertDialogDeleteHeader>
          <AlertDialogDeleteFooter>
            <AlertDialogCancel onClick={() => {setIsDeleteAlertOpen(false); setDesignToDelete(null);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogDeleteFooter>
        </AlertDialogDeleteContent>
      </AlertDialog>
    </>
  );
}

