
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
        className={cn(
          "flex flex-col gap-3 max-w-md mx-auto", // Default to column layout
          "sm:flex-row sm:items-end sm:gap-3",   // On sm and up, switch to row and align items to their end
          className
        )}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-grow"> {/* flex-grow makes it take available horizontal space in row layout */}
              <FormLabel className="sr-only">Email for newsletter</FormLabel>
              <FormControl>
                <Input
                    type="email"
                    placeholder="Enter your email address"
                    className="h-12 text-base bg-card border-border/70 focus:border-primary"
                    {...field}
                />
              </FormControl>
              <FormMessage className="text-left text-sm mt-1" /> {/* Positioned below the input */}
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
