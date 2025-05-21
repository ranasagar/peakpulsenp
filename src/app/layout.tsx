
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { CartProvider } from '@/context/cart-context';

export const metadata: Metadata = {
  title: {
    default: 'Peak Pulse - Nepali Craftsmanship Meets Contemporary Streetwear',
    template: '%s | Peak Pulse',
  },
  description: 'Discover Peak Pulse, a Nepali clothing brand blending traditional craftsmanship with contemporary streetwear. Shop unique, high-quality apparel.',
  keywords: ['Peak Pulse', 'Nepali clothing', 'streetwear', 'fashion', 'contemporary design', 'traditional craftsmanship'],
  // Manifest link was removed as part of PWA rollback, if next-pwa handled it, it's fine.
  // If you had a manual manifest link here, it would have been removed.
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' }, // Light theme background
    { media: '(prefers-color-scheme: dark)', color: '#111827' },  // Dark theme background
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Ensure no direct whitespace here */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        {/* Any other direct children of head like meta, link, script must be tightly packed or without intervening whitespace nodes */}
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark', 'system', 'sustainable']}
        >
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
