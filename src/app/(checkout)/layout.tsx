
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Simplified Header for Checkout
const CheckoutHeader = () => (
  <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container-wide flex h-20 items-center justify-between">
      <Link href="/" className="flex items-center space-x-2">
        <Icons.Logo className="h-8 w-8 text-primary" />
        <span className="font-semibold text-xl text-foreground">
          Peak Pulse
        </span>
      </Link>
      <Button variant="outline" size="sm" asChild>
        <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
        </Link>
      </Button>
    </div>
  </header>
);

// Simplified Footer for Checkout
const CheckoutFooter = () => (
  <footer className="bg-card text-card-foreground border-t border-border/60">
    <div className="container-wide py-8 text-center">
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Peak Pulse. Secure Checkout.
      </p>
       <div className="mt-2 space-x-4">
            <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary">Terms of Service</Link>
       </div>
    </div>
  </footer>
);


export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <CheckoutHeader />
      <main className="flex-grow">
        {children}
      </main>
      <CheckoutFooter />
    </div>
  );
}
