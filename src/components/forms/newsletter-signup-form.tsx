
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const newsletterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export function NewsletterSignupForm({ className }: { className?: string }) {
  const { toast } = useToast();
  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: NewsletterFormValues) => {
    // Mock API call for newsletter subscription
    console.log("Newsletter subscription data:", data);
    toast({
      title: "Subscribed!",
      description: "Thanks for joining our newsletter. Keep an eye on your inbox!",
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto ${className}`}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel className="sr-only">Email for newsletter</FormLabel>
              <FormControl>
                <Input 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="h-12 text-base bg-card border-border/70 focus:border-primary" 
                    {...field} 
                />
              </FormControl>
              <FormMessage className="text-left text-sm mt-1" />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="h-12 text-base whitespace-nowrap">
          Subscribe <Send className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
