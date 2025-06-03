
"use client"; 

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { AlertCircle, LogIn, Loader2 as LocalLoader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }), 
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginClientContent() {
  "use client"; 

  const { login, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const [redirectAttempted, setRedirectAttempted] = useState(false);


  useEffect(() => {
    if (!authIsLoading && isAuthenticated && !redirectAttempted) {
      const redirectParam = searchParams.get('redirect');
      let targetPath: string;

      if (redirectParam) {
        try {
          const decodedRedirectParam = decodeURIComponent(redirectParam);
          if (decodedRedirectParam.trim() === '' || decodedRedirectParam === '/login' || decodedRedirectParam.startsWith('/login?') || decodedRedirectParam === '/register' || decodedRedirectParam.startsWith('/register?')) {
            targetPath = '/dashboard'; // Corrected
          } else {
            targetPath = decodedRedirectParam;
          }
        } catch (e) {
          targetPath = '/dashboard'; // Corrected Fallback
        }
      } else {
        targetPath = '/dashboard'; // Corrected Default
      }
      setRedirectAttempted(true); 
      router.push(targetPath);
    }
  }, [isAuthenticated, authIsLoading, router, searchParams, redirectAttempted]);

  useEffect(() => {
    if (!isAuthenticated && !authIsLoading) {
      setRedirectAttempted(false);
    }
  }, [isAuthenticated, authIsLoading]);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '', 
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    const result = await login(data.email, data.password); 
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Invalid email or password. Please try again.');
      form.resetField("password");
    }
    setRedirectAttempted(false); 
  };

  if (authIsLoading && !isAuthenticated) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LocalLoader className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading session...</p>
      </div>
    );
  }
  
  if (isAuthenticated && !redirectAttempted && !authIsLoading) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <LocalLoader className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Login successful. Redirecting...</p>
      </div>
    );
  }
  
  if (redirectAttempted && isAuthenticated) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="mt-4 text-muted-foreground">Redirecting... If you are not redirected, click <Link href="/dashboard" className="underline text-primary">here</Link>.</p>
      </div>
    );
  }


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
              <Button type="submit" className="w-full !mt-8 text-base py-3" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LocalLoader className="mr-2 h-5 w-5 animate-spin" />
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
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center p-4"><LocalLoader className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading login page...</p></div>}>
      <LoginClientContent />
    </Suspense>
  );
}

    