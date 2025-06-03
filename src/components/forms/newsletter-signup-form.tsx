
"use client";

import { useState } from 'react'; // Added useState for loading state
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const newsletterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export function NewsletterSignupForm({ className, source = "unknown" }: { className?: string, source?: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: NewsletterFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, source }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: response.status === 201 ? "Subscribed!" : "Welcome Back!",
          description: result.message || "You're all set for Peak Pulse updates.",
        });
        form.reset();
      } else {
        toast({
          title: "Subscription Failed",
          description: result.message || "Could not subscribe. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "flex flex-col gap-3 max-w-md mx-auto", 
          "sm:flex-row sm:items-end sm:gap-3",   
          className
        )}
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
                    disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-left text-sm mt-1" /> 
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="h-12 text-base whitespace-nowrap" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
    </Form>
  );
}

    