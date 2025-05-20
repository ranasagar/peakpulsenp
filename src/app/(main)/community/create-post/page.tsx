
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, ImagePlus, Tag, Send } from 'lucide-react';
import Link from 'next/link';

const userPostSchema = z.object({
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }),
  caption: z.string().max(500, "Caption can be up to 500 characters.").optional(),
  productTags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag) : []),
});

type UserPostFormValues = z.infer<typeof userPostSchema>;

export default function CreateUserPostPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserPostFormValues>({
    resolver: zodResolver(userPostSchema),
    defaultValues: {
      imageUrl: '',
      caption: '',
      productTags: [],
    },
  });

  const onSubmit = async (data: UserPostFormValues) => {
    if (!isAuthenticated || !user) {
      toast({ title: "Authentication Required", description: "Please log in to share your style.", variant: "destructive" });
      router.push('/login?redirect=/community/create-post');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        imageUrl: data.imageUrl,
        caption: data.caption,
        productTags: data.productTags,
      };

      const response = await fetch('/api/user-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit post.');
      }

      toast({
        title: "Post Submitted!",
        description: "Your style has been submitted for review. Thank you for sharing!",
      });
      form.reset();
      router.push('/'); 
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container-slim section-padding flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="container-slim section-padding text-center">
        <Card className="max-w-md mx-auto p-8">
          <CardTitle className="text-2xl mb-4">Login Required</CardTitle>
          <CardDescription className="mb-6">
            You need to be logged in to share your Peak Pulse style.
          </CardDescription>
          <Button asChild size="lg">
            <Link href="/login?redirect=/community/create-post">Login to Share</Link>
          </Button>
        </Card>
      </div>
    );
  }


  return (
    <div className="container-slim section-padding">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <ImagePlus className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Share Your Peak Pulse Style</CardTitle>
          <CardDescription>Show off how you wear Peak Pulse! Upload an image URL and tell us about your look.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL*</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/your-image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Tip: Upload your image to a free hosting service (e.g., Imgur, Cloudinary free tier, Firebase Storage) then paste the direct image URL (ending in .jpg, .png, .gif, etc.) here.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your outfit, the occasion, or what you love about Peak Pulse!" {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />Featured Products (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Himalayan Breeze Jacket, Urban Nomad Pants" {...field} 
                       onChange={(e) => field.onChange(e.target.value)}
                       value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Separate product names with commas.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Your Style
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
