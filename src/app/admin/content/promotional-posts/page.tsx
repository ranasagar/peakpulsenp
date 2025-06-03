
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, Edit, Image as ImageIconLucide, Percent, CalendarDays, Palette } from 'lucide-react';
import type { PromotionalPost } from '@/types';
import { Dialog, DialogContent, DialogDescription as DialogFormDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent as AlertDialogDeleteContent, AlertDialogDescription as AlertDialogDeleteDescription, AlertDialogFooter as AlertDialogDeleteFooter, AlertDialogHeader as AlertDialogDeleteHeader, AlertDialogTitle as AlertDialogDeleteTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { formatInputDate, formatDisplayDate } from '@/lib/dateUtils';
import { Badge } from '@/components/ui/badge';


const promotionalPostSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens.").optional().or(z.literal('')),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: "Valid image URL is required." }).min(1, "Image URL cannot be empty."),
  imageAltText: z.string().optional(),
  dataAiHint: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional().refine(val => !val || val.startsWith('/') || val.startsWith('http') || val.startsWith('#'), {
    message: "CTA link must be a relative path, an anchor, or a full URL."
  }),
  price: z.coerce.number().min(0, "Price must be non-negative.").optional().nullable(),
  discountPrice: z.coerce.number().min(0, "Discount price must be non-negative.").optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().optional().default(0),
  sku: z.string().optional(), 
  backgroundColor: z.string().optional().refine(val => !val || /^#([0-9A-Fa-f]{3,4}){1,2}$/.test(val) || val.startsWith('bg-'), { message: "Enter a valid hex color (e.g. #RRGGBB) or Tailwind bg class (e.g. bg-blue-500)." }),
  textColor: z.string().optional().refine(val => !val || /^#([0-9A-Fa-f]{3,4}){1,2}$/.test(val) || val.startsWith('text-'), { message: "Enter a valid hex color or Tailwind text class." }),
}).refine(data => !data.discountPrice || (data.price !== undefined && data.price !== null && data.discountPrice <= data.price), {
  message: "Discount price cannot be greater than the original price.",
  path: ["discountPrice"],
}).refine(data => !data.validUntil || !data.validFrom || new Date(data.validUntil) >= new Date(data.validFrom), {
  message: "Valid until date must be after or same as valid from date.",
  path: ["validUntil"],
});


type PromotionalPostFormValues = z.infer<typeof promotionalPostSchema>;

export default function AdminPromotionalPostsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<PromotionalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<PromotionalPost | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PromotionalPost | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const form = useForm<PromotionalPostFormValues>({
    resolver: zodResolver(promotionalPostSchema),
    defaultValues: {
      title: '', slug: '', description: '', imageUrl: '', imageAltText: '', dataAiHint: '',
      ctaText: '', ctaLink: '', price: null, discountPrice: null,
      validFrom: '', validUntil: '', isActive: true, displayOrder: 0,
      sku: '',
      backgroundColor: '', textColor: '',
    },
  });

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/promotional-posts');
      if (!response.ok) throw new Error('Failed to fetch promotional posts');
      const data: PromotionalPost[] = await response.json();
      setPosts(data);
    } catch (error) {
      toast({ title: "Error Fetching Posts", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleEdit = (post: PromotionalPost) => {
    setEditingPost(post);
    form.reset({
      ...post,
      title: post.title || '',
      slug: post.slug || '',
      description: post.description || '',
      imageUrl: post.imageUrl || '',
      imageAltText: post.imageAltText || '',
      dataAiHint: post.dataAiHint || '',
      ctaText: post.ctaText || '',
      ctaLink: post.ctaLink || '',
      price: post.price === undefined ? null : post.price,
      discountPrice: post.discountPrice === undefined ? null : post.discountPrice,
      validFrom: post.validFrom ? formatInputDate(post.validFrom) : '',
      validUntil: post.validUntil ? formatInputDate(post.validUntil) : '',
      isActive: post.isActive === undefined ? true : post.isActive,
      displayOrder: post.displayOrder === undefined ? 0 : post.displayOrder,
      sku: post.sku || '', 
      backgroundColor: post.backgroundColor || '',
      textColor: post.textColor || '',
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingPost(null);
    form.reset({
      title: `New Promo ${Date.now()}`, slug: '', description: '', imageUrl: '', imageAltText: '', dataAiHint: '',
      ctaText: 'Shop Now', ctaLink: '/products', price: null, discountPrice: null,
      validFrom: formatInputDate(new Date()), validUntil: '', isActive: true, displayOrder: (posts.length + 1) * 10,
      sku: '',
      backgroundColor: '#E0F2FE', textColor: '#0C4A6E', 
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: PromotionalPostFormValues) => {
    setIsSaving(true);
    const method = editingPost ? 'PUT' : 'POST';
    const url = editingPost ? `/api/admin/promotional-posts/${editingPost.id}` : '/api/admin/promotional-posts';
    
    const payload = {
      ...data,
      slug: data.slug?.trim() || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      validFrom: data.validFrom || null, 
      validUntil: data.validUntil || null,
      description: data.description || null,
      imageAltText: data.imageAltText || null,
      dataAiHint: data.dataAiHint || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,
      sku: data.sku || null,
      backgroundColor: data.backgroundColor || null,
      textColor: data.textColor || null,
    };

    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingPost ? 'update' : 'create'} post`);
      }
      toast({ title: "Success!", description: `Promotional post "${payload.title}" ${editingPost ? 'updated' : 'created'}.` });
      fetchPosts();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/promotional-posts/${postToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete post');
      toast({ title: "Post Deleted", description: `"${postToDelete.title}" deleted.` });
      fetchPosts();
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsDeleteAlertOpen(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl"><CardHeader><CardTitle className="text-2xl flex items-center"><Percent className="mr-3 h-6 w-6 text-primary"/>Manage Promotional Posts</CardTitle><CardDescription>Loading posts...</CardDescription></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-xl flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Percent className="mr-3 h-6 w-6 text-primary"/>Manage Promotional Posts</CardTitle>
            <CardDescription>Create, edit, and manage promotional content for your site.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> Add New Post</Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            {posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No promotional posts found.</p>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <Card key={post.id} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 flex-grow">
                      <Image 
                        src={post.imageUrl && post.imageUrl.trim() !== '' ? post.imageUrl : 'https://placehold.co/100x60.png'} 
                        alt={post.title} 
                        width={100} 
                        height={60} 
                        className="rounded-md object-cover bg-muted" 
                        data-ai-hint={post.dataAiHint || 'promotion marketing'} 
                      />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-foreground">{post.title} <Badge variant={post.isActive ? "default" : "outline"}>{post.isActive ? 'Active' : 'Inactive'}</Badge></h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">Slug: {post.slug} | Order: {post.displayOrder}</p>
                        {post.price != null && <p className="text-xs text-muted-foreground">Price: रू{post.price}{post.discountPrice != null && <span className="line-through ml-1"> रू{post.discountPrice}</span>}</p>}
                         <div className="flex items-center gap-1 mt-1">
                            <div style={{ backgroundColor: post.backgroundColor || 'transparent', color: post.textColor || 'inherit' }} className="text-xs px-2 py-0.5 rounded-full border border-border">Preview Style</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 pt-2 sm:pt-0">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(post)}><Edit className="mr-1.5 h-3 w-3" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => { setPostToDelete(post); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-1.5 h-3 w-3" /> Delete</Button>
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
            <DialogTitle>{editingPost ? 'Edit Promotional Post' : 'Add New Promotional Post'}</DialogTitle>
            <DialogFormDescription> {/* Added description for accessibility */}
              {editingPost ? `Modifying details for "${editingPost.title}".` : 'Fill in the details for the new promotional post.'}
            </DialogFormDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 -mx-1"><div className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title*</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="auto-generated from title" /></FormControl><FormDescription>Lowercase, hyphens only.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL*</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://example.com/promo.jpg" /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="imageAltText" render={({ field }) => (<FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>Image AI Hint</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. sale banner modern" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ctaText" render={({ field }) => (<FormItem><FormLabel>CTA Button Text</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g., Shop Now" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="ctaLink" render={({ field }) => (<FormItem><FormLabel>CTA Button Link</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="/products or https://..." /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Original Price (Optional)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="discountPrice" render={({ field }) => (<FormItem><FormLabel>Discounted Price (Optional)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU (Optional)</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4 items-end">
                    <FormField control={form.control} name="validFrom" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4 text-muted-foreground"/>Valid From</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="validUntil" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4 text-muted-foreground"/>Valid Until</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-2 gap-4 items-end">
                    <FormField control={form.control} name="backgroundColor" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Palette className="mr-1.5 h-4 w-4 text-muted-foreground"/>Background Color</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="#RRGGBB or bg-blue-500" /></FormControl><FormDescription>Hex or Tailwind class.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="textColor" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Palette className="mr-1.5 h-4 w-4 text-muted-foreground"/>Text Color</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="#RRGGBB or text-white" /></FormControl><FormDescription>Hex or Tailwind class.</FormDescription><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                    <FormField control={form.control} name="displayOrder" render={({ field }) => (<FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormDescription>Lower numbers appear first.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm h-10"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal cursor-pointer">Active</FormLabel></FormItem>)} />
                </div>
                <DialogFooter className="pt-4">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{editingPost ? 'Save Changes' : 'Create Post'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </div></ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogDeleteContent>
          <AlertDialogDeleteHeader><AlertDialogDeleteTitle>Are you sure?</AlertDialogDeleteTitle><AlertDialogDeleteDescription>This will permanently delete the post "{postToDelete?.title}".</AlertDialogDeleteDescription></AlertDialogDeleteHeader>
          <AlertDialogDeleteFooter><AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete</AlertDialogAction></AlertDialogDeleteFooter>
        </AlertDialogDeleteContent>
      </AlertDialog>
    </>
  );
}
