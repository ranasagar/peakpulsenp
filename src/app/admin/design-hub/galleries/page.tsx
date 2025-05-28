
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, Save, PlusCircle, Trash2, Edit, Image as ImageIconLucide, Palette, CalendarDays, User as UserIcon } from 'lucide-react';
import type { DesignCollaborationGallery, DesignCollaborationCategory, GalleryImageItem } from '@/types';
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
import { formatInputDate, formatDisplayDate } from '@/lib/dateUtils';

const NO_COLLAB_CATEGORY_ID_VALUE = "__NONE_CATEGORY__";

const galleryImageItemSchema = z.object({
  id: z.string().optional(),
  url: z.string().url({ message: "Valid image URL is required." }).min(1, "Image URL cannot be empty."),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
  displayOrder: z.coerce.number().int().optional(),
});

const gallerySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens."),
  description: z.string().optional(),
  category_id: z.string().nullable().optional(),
  cover_image_url: z.string().url({ message: "Valid cover image URL required."}).optional().or(z.literal('')),
  ai_cover_image_prompt: z.string().optional(),
  artist_name: z.string().optional(),
  artist_statement: z.string().optional(),
  gallery_images: z.array(galleryImageItemSchema).min(0).optional(),
  is_published: z.boolean().default(false),
  collaboration_date: z.string().optional().or(z.literal('')),
});

type GalleryFormValues = z.infer<typeof gallerySchema>;

const defaultGalleryImage: Omit<GalleryImageItem, 'id'> = { url: '', altText: '', dataAiHint: '', displayOrder: 0};

export default function AdminDesignCollaborationsPage() {
  const { toast } = useToast();
  const [galleries, setGalleries] = useState<DesignCollaborationGallery[]>([]);
  const [categories, setCategories] = useState<DesignCollaborationCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGallery, setEditingGallery] = useState<DesignCollaborationGallery | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState<DesignCollaborationGallery | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: '', slug: '', description: '', category_id: null, cover_image_url: '', ai_cover_image_prompt: '',
      artist_name: '', artist_statement: '', gallery_images: [], is_published: false, collaboration_date: formatInputDate(new Date()),
    },
  });

  const { fields: galleryImagesFields, append: appendGalleryImage, remove: removeGalleryImage, replace: replaceGalleryImages } = useFieldArray({
    control: form.control,
    name: "gallery_images",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [galleriesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/design-collaborations'),
        fetch('/api/admin/design-collaboration-categories')
      ]);
      if (!galleriesRes.ok) {
        const errorData = await galleriesRes.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch collaborations');
      }
      if (!categoriesRes.ok) {
        const errorData = await categoriesRes.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch collaboration categories');
      }

      const galleriesData: DesignCollaborationGallery[] = await galleriesRes.json();
      const categoriesData: DesignCollaborationCategory[] = await categoriesRes.json();

      setGalleries(galleriesData);
      setCategories(categoriesData);
    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (gallery: DesignCollaborationGallery) => {
    setEditingGallery(gallery);
    form.reset({
      ...gallery,
      category_id: gallery.category_id || null,
      collaboration_date: gallery.collaboration_date ? formatInputDate(new Date(gallery.collaboration_date)) : '',
      gallery_images: (gallery.gallery_images || []).map((img, index) => ({
        ...img,
        id: img.id || `img-client-${Date.now()}-${index}`,
        displayOrder: img.displayOrder === undefined ? index : img.displayOrder
      })),
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingGallery(null);
    form.reset({
      title: '', slug: '', description: '', category_id: null, cover_image_url: '', ai_cover_image_prompt: '',
      artist_name: '', artist_statement: '', gallery_images: [], is_published: false, collaboration_date: formatInputDate(new Date()),
    });
    replaceGalleryImages([]);
    setIsFormOpen(true);
  };

  const onSubmit = async (data: GalleryFormValues) => {
    setIsSaving(true);
    const method = editingGallery ? 'PUT' : 'POST';
    const url = editingGallery ? `/api/admin/design-collaborations/${editingGallery.id}` : '/api/admin/design-collaborations';

    const payload = {
      ...data,
      slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      category_id: data.category_id === NO_COLLAB_CATEGORY_ID_VALUE ? null : data.category_id,
      collaboration_date: data.collaboration_date || null,
      gallery_images: (data.gallery_images || []).map(({id, ...img}, index) => ({
        ...img,
        displayOrder: img.displayOrder === undefined ? index : img.displayOrder
      })),
    };

    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to ${editingGallery ? 'update' : 'create'} collaboration`);
      }
      toast({ title: "Success!", description: `Collaboration "${payload.title}" ${editingGallery ? 'updated' : 'created'}.` });
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!galleryToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/design-collaborations/${galleryToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message ||'Failed to delete collaboration');
      }
      toast({ title: "Collaboration Deleted", description: `"${galleryToDelete.title}" deleted.` });
      fetchData();
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsDeleteAlertOpen(false);
    }
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return 'N/A';
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg flex flex-col h-full">
        <CardHeader><CardTitle className="text-2xl flex items-center"><Palette className="mr-3 h-6 w-6 text-primary"/>Manage Design Collaborations/Galleries</CardTitle><CardDescription>Loading data...</CardDescription></CardHeader>
        <CardContent className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Palette className="mr-3 h-6 w-6 text-primary"/>Manage Design Collaborations/Galleries</CardTitle>
            <CardDescription>Showcase artistic collaborations and image galleries.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> Add New Collaboration</Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            {galleries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No collaborations found. Add one to get started.</p>
            ) : (
              <div className="space-y-4">
                {galleries.map(gallery => (
                  <Card key={gallery.id} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 flex-grow">
                      {gallery.cover_image_url ? (
                        <Image src={gallery.cover_image_url} alt={gallery.title} width={80} height={60} className="rounded-md object-cover aspect-video bg-muted" data-ai-hint={gallery.ai_cover_image_prompt || 'gallery cover art'} />
                      ) : (
                        <div className="w-[80px] h-[60px] bg-muted rounded-md flex items-center justify-center">
                          <ImageIconLucide className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-foreground">{gallery.title} <span className="text-xs text-muted-foreground">({gallery.slug})</span></h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">Artist: {gallery.artist_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Category: {getCategoryName(gallery.category_id)} | Published: {gallery.is_published ? 'Yes' : 'No'}</p>
                        {gallery.collaboration_date && <p className="text-xs text-muted-foreground">Date: {formatDisplayDate(gallery.collaboration_date)}</p>}
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 pt-2 sm:pt-0">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(gallery)}><Edit className="mr-1.5 h-3 w-3" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => { setGalleryToDelete(gallery); setIsDeleteAlertOpen(true); }}>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingGallery ? 'Edit Collaboration/Gallery' : 'Add New Collaboration/Gallery'}</DialogTitle>
             <DialogFormDescription>
              {editingGallery ? `Editing details for ${editingGallery.title}.` : 'Fill in the details for the new collaboration.'}
            </DialogFormDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] p-1 -mx-1">
            <div className="p-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Title*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem><FormLabel>Slug*</FormLabel><FormControl><Input {...field} placeholder="auto-generated if empty" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category_id" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === NO_COLLAB_CATEGORY_ID_VALUE ? null : value)}
                        value={field.value === null || field.value === undefined || field.value === '' ? NO_COLLAB_CATEGORY_ID_VALUE : field.value}
                      >
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={NO_COLLAB_CATEGORY_ID_VALUE}>None</SelectItem>
                          {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="artist_name" render={({ field }) => (
                    <FormItem><FormLabel>Artist Name</FormLabel><FormControl><Input {...field} placeholder="Collaborating artist's name" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="artist_statement" render={({ field }) => (
                    <FormItem><FormLabel>Artist Statement</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="A brief statement from/about the artist" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="cover_image_url" render={({ field }) => (
                      <FormItem><FormLabel>Cover Image URL</FormLabel><FormControl><Input {...field} placeholder="https://example.com/cover.jpg" /></FormControl>
                      <FormDescription>Use services like ImgBB.com or Postimages.org for free uploads. Paste the "Direct link" (ending in .jpg, .png, etc.).</FormDescription><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="ai_cover_image_prompt" render={({ field }) => (
                      <FormItem><FormLabel>AI Cover Image Prompt</FormLabel><FormControl><Input {...field} placeholder="Prompt for cover image" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <FormField control={form.control} name="collaboration_date" render={({ field }) => (
                      <FormItem><FormLabel>Collaboration Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="is_published" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm mt-6">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal mb-0! pt-0!">Published to Site</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <fieldset className="space-y-3 p-3 border rounded-md">
                    <legend className="text-md font-medium px-1 flex items-center"><ImageIconLucide className="mr-2 h-4 w-4"/>Gallery Images</legend>
                    <ScrollArea className="max-h-80">
                        <div className="space-y-3 p-1">
                        {galleryImagesFields.map((item, index) => (
                        <Card key={item.id} className="p-3 space-y-2 bg-muted/50">
                            <FormLabel className="text-sm">Image {index + 1}</FormLabel>
                            <FormField control={form.control} name={`gallery_images.${index}.url`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">URL*</FormLabel><FormControl><Input {...field} placeholder="https://example.com/gallery_img.jpg" /></FormControl><FormDescription>Use "Direct link" from ImgBB/Postimages.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-2">
                            <FormField control={form.control} name={`gallery_images.${index}.altText`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Alt Text</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name={`gallery_images.${index}.dataAiHint`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">AI Hint</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                            )} />
                            </div>
                            <FormField control={form.control} name={`gallery_images.${index}.displayOrder`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Display Order</FormLabel><FormControl><Input type="number" {...field} value={field.value === undefined ? index : field.value} onChange={(e) => field.onChange(parseInt(e.target.value,10))} /></FormControl></FormItem>
                            )} />
                            <Button type="button" variant="destructive" size="xs" onClick={() => removeGalleryImage(index)}><Trash2 className="mr-1 h-3 w-3"/>Remove Image</Button>
                        </Card>
                        ))}
                        </div>
                    </ScrollArea>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendGalleryImage({ ...defaultGalleryImage, id: `client-img-${Date.now()}`, displayOrder: galleryImagesFields.length })}><PlusCircle className="mr-2 h-4 w-4"/>Add Gallery Image</Button>
                  </fieldset>

                  <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {editingGallery ? 'Save Changes' : 'Create Collaboration'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogDeleteContent>
          <AlertDialogDeleteHeader>
            <AlertDialogDeleteTitle>Are you sure?</AlertDialogDeleteTitle>
            <AlertDialogDeleteDescription>
              This will permanently delete the collaboration "{galleryToDelete?.title}".
            </AlertDialogDeleteDescription>
          </AlertDialogDeleteHeader>
          <AlertDialogDeleteFooter>
            <AlertDialogCancel onClick={() => setGalleryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogDeleteFooter>
        </AlertDialogDeleteContent>
      </AlertDialog>
    </>
  );
}
