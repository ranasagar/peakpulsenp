
import Link from 'next/link';
import { Shield, LayoutDashboard, Settings, ArrowLeft, BookOpenText, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-muted/30">
        <div className="container-wide section-padding pt-8 md:pt-12"> {/* Adjusted top padding */}
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
              <nav className="bg-card p-4 rounded-lg shadow-sm space-y-2 sticky top-28">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </Button>
                 <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/admin/products">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Manage Products
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/admin/content/homepage">
                    <Settings className="mr-2 h-4 w-4" /> Homepage Content
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/admin/content/our-story">
                    <BookOpenText className="mr-2 h-4 w-4" /> Our Story Content
                  </Link>
                </Button>
                {/* Add more admin links here */}
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
