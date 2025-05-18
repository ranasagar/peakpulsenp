
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Not used directly but kept for consistency
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { AlertCircle, LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }), // Min 1 for mock, typically 6-8
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@peakpulse.com', // Mock email for Peak Pulse
      password: 'password', // Mock password
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    // Use a specific mock email for Peak Pulse if needed, or keep generic
    const success = await login(data.email, data.password); 
    if (!success) {
      setError('Invalid email or password. Please try again.');
      form.resetField("password");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center space-y-2">
          <Link href="/" className="inline-block mx-auto mb-3">
            <Icons.Logo className="h-12 w-12 text-primary" />
          </Link>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Welcome to Peak Pulse</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to access your account and explore exclusive collections.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Email Address</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password">Password</FormLabel>
                    <FormControl>
                      <Input id="password" type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full !mt-8 text-base py-3" disabled={isLoading}>
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : <LogIn className="mr-2 h-4 w-4" /> }
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm space-y-2 pt-6">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto font-medium text-primary">
                <Link href="/register">Sign Up</Link>
            </Button>
          </p>
          <p className="text-xs text-muted-foreground/70 text-center">
            Mock credentials: admin@peakpulse.com / password
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
