
import Link from 'next/link';
import { Shield, LayoutDashboard, Settings, ArrowLeft, BookOpenText, ShoppingBag, BarChart3, ListOrdered, Landmark, Tags } from 'lucide-react'; // Added Tags
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <aside className="md:col-span-1">
              <nav className="bg-card p-4 rounded-lg shadow-sm space-y-1 sticky top-28">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </Button>
                
                <Accordion type="single" collapsible className="w-full" defaultValue="store-management">
                  <AccordionItem value="store-management" className="border-b-0">
                    <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                       <div className="flex items-center">
                         <ShoppingBag className="mr-2 h-4 w-4" /> Store Management
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pl-4">
                       <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9" asChild>
                          <Link href="/admin/products">
                             Manage Products
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9" asChild>
                          <Link href="/admin/categories">
                            <Tags className="mr-2 h-4 w-4" /> Manage Categories
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9" asChild>
                          <Link href="/admin/orders">
                            <ListOrdered className="mr-2 h-4 w-4" /> View Orders
                          </Link>
                        </Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="content-management" className="border-b-0">
                    <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                       <div className="flex items-center">
                         <BookOpenText className="mr-2 h-4 w-4" /> Content Management
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pl-4">
                      <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9" asChild>
                        <Link href="/admin/content/homepage">
                           Homepage Content
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9" asChild>
                        <Link href="/admin/content/our-story">
                           Our Story Content
                        </Link>
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="accounting" className="border-b-0">
                    <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                       <div className="flex items-center">
                         <Landmark className="mr-2 h-4 w-4" /> Accounting
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pl-4">
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9" asChild>
                          <Link href="/admin/accounting/loans">
                             Manage Loans
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9" asChild>
                          <Link href="/admin/accounting/tax-report">
                             Tax Data Export
                          </Link>
                        </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/admin/analytics">
                    <BarChart3 className="mr-2 h-4 w-4" /> Site Analytics (AI)
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/admin/settings"> {/* Placeholder for general settings */}
                    <Settings className="mr-2 h-4 w-4" /> General Settings
                  </Link>
                </Button>
              </nav>
            </aside>
            <div className="md:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
