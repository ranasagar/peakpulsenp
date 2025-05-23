
"use client"; 

import Link from 'next/link';
import { Shield, LayoutDashboard, Settings, ArrowLeft, BookOpenText, ShoppingBag, BarChart3, ListOrdered, Landmark, Tags, Users, ListChecks, FileText, Package, Home as HomeIcon, PenSquare, DollarSign, FileSpreadsheet, Palette, ImageIcon as ImageIconLucide, Printer } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container-wide section-padding">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="p-4 md:col-span-1"><Skeleton className="h-64 w-full" /></Card>
            <Card className="p-6 md:col-span-3"><Skeleton className="h-96 w-full" /></Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user?.roles?.includes('admin')) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container-wide section-padding flex items-center justify-center">
          <Card className="p-8 text-center shadow-xl">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
            <Button asChild><Link href="/">Go to Homepage</Link></Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-muted/30">
        <div className="container-wide section-padding pt-8 md:pt-12">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <Button variant="outline" asChild>
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Site</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="w-full md:col-span-1 md:sticky md:top-28 bg-card p-4 rounded-lg shadow-sm h-fit">
              <ScrollArea className="md:max-h-[calc(100vh-10rem)]"> {/* Adjusted max-h and removed h-auto */}
                <nav className="space-y-1"> {/* Removed pr-2 */}
                  <Button variant="ghost" className="w-full justify-start pl-2 pr-3 py-2" asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </Button>
                  
                  <Accordion type="multiple" defaultValue={['store-management', 'content-management', 'design-hub', 'accounting']} className="w-full">
                    <AccordionItem value="store-management" className="border-b-0">
                      <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                        <div className="flex items-center">
                          <ShoppingBag className="mr-2 h-4 w-4" /> Store Management
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pl-4 space-y-0.5">
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                            <Link href="/admin/products"><Package className="mr-2 h-4 w-4" />Manage Products</Link>
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                            <Link href="/admin/categories"><Tags className="mr-2 h-4 w-4" /> Manage Categories</Link>
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                            <Link href="/admin/orders"><ListOrdered className="mr-2 h-4 w-4" /> View Orders</Link>
                          </Button>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="content-management" className="border-b-0">
                      <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                        <div className="flex items-center">
                          <BookOpenText className="mr-2 h-4 w-4" /> Content Management
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pl-4 space-y-0.5">
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                          <Link href="/admin/content/homepage"><HomeIcon className="mr-2 h-4 w-4" />Homepage</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                          <Link href="/admin/content/our-story"><PenSquare className="mr-2 h-4 w-4" />Our Story</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                          <Link href="/admin/content/footer"><ListChecks className="mr-2 h-4 w-4" /> Footer</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                          <Link href="/admin/content/site-pages"><FileText className="mr-2 h-4 w-4" /> Site Pages</Link>
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="design-hub" className="border-b-0">
                      <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                        <div className="flex items-center">
                          <Palette className="mr-2 h-4 w-4" /> Design Hub
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pl-4 space-y-0.5">
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                          <Link href="/admin/design-hub/collaboration-categories"><Tags className="mr-2 h-4 w-4" />Collab Categories</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                          <Link href="/admin/design-hub/galleries"><ImageIconLucide className="mr-2 h-4 w-4" />Collab Galleries</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                          <Link href="/admin/design-hub/print-designs"><Printer className="mr-2 h-4 w-4" />Print Designs</Link>
                        </Button>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="accounting" className="border-b-0">
                      <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                        <div className="flex items-center">
                          <Landmark className="mr-2 h-4 w-4" /> Accounting
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pl-4 space-y-0.5">
                          <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                            <Link href="/admin/accounting/loans"><DollarSign className="mr-2 h-4 w-4" />Manage Loans</Link>
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 pl-2 pr-3 py-2" asChild>
                            <Link href="/admin/accounting/tax-report"><FileSpreadsheet className="mr-2 h-4 w-4" />Tax Data Export</Link>
                          </Button>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Button variant="ghost" className="w-full justify-start pl-2 pr-3 py-2" asChild>
                    <Link href="/admin/analytics">
                      <BarChart3 className="mr-2 h-4 w-4" /> Site Analytics (AI)
                    </Link>
                  </Button>
                   <Button variant="ghost" className="w-full justify-start pl-2 pr-3 py-2" asChild>
                    <Link href="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" /> General Settings
                    </Link>
                  </Button>
                </nav>
              </ScrollArea>
            </aside>
            <div className="w-full md:col-span-3 md:col-start-2">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    