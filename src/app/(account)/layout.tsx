
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Corrected usePathname import
import { useAuth } from '@/hooks/use-auth';
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card'; // Card was missing an import here
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Construct the redirect query parameter carefully
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container-wide section-padding">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Card className="p-4">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-5/6" />
              </Card>
            </div>
            <div className="md:col-span-3">
              <Card className="p-6">
                <Skeleton className="h-10 w-1/2 mb-6" />
                <Skeleton className="h-32 w-full" />
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) { // Check !isLoading here too
     // This state should ideally be brief due to the redirect.
    return (
       <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container-wide section-padding flex items-center justify-center">
            <Card className="max-w-md w-full p-8 text-center shadow-xl">
                <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
                <p className="text-muted-foreground mb-6">You must be logged in to view this page.</p>
                <Button asChild>
                    <Link href={`/login?redirect=${encodeURIComponent(pathname || '/account/dashboard')}`}>Login</Link>
                </Button>
            </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  // VIP Collection check
  if (pathname?.includes('/vip-collection') && !user?.roles?.includes('vip') && !user?.roles?.includes('admin')) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container-wide section-padding flex items-center justify-center">
          <Card className="max-w-md w-full p-8 text-center shadow-xl">
            <AlertTriangle className="h-16 w-16 text-accent mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">VIP Access Required</h1>
            <p className="text-muted-foreground mb-6">This collection is exclusive to our VIP members.</p>
            <Button asChild variant="outline">
              <Link href="/products">Explore Other Collections</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Affiliate Portal check
   if (pathname?.includes('/affiliate-portal') && !user?.roles?.includes('affiliate') && !user?.roles?.includes('admin')) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container-wide section-padding flex items-center justify-center">
          <Card className="max-w-md w-full p-8 text-center shadow-xl">
            <AlertTriangle className="h-16 w-16 text-accent mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Affiliate Access Required</h1>
            <p className="text-muted-foreground mb-6">This portal is for registered affiliates only.</p>
            <Button asChild variant="outline">
              <Link href="/">Return Home</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // If authenticated and authorized for the specific sub-route, render children
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-background">
        {children}
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
