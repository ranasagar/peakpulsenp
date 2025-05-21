
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Peak Pulse',
    // startupImage: [], // You can add startup images here if needed
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' }, // Light theme background
    { media: '(prefers-color-scheme: dark)', color: '#111827' },  // Dark theme background
  ],
  // Adding PWA specific viewport settings
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // Optional, for edge-to-edge displays
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Standard PWA meta tags */}
        <meta name="application-name" content="Peak Pulse" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Peak Pulse" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" /> {/* Optional: if you create this file */}
        <meta name="msapplication-TileColor" content="#1E6A7B" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Link to manifest.json is now handled by next-pwa through Metadata API, but also good to have here */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon links (can be enhanced with more sizes) */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" /> {/* Example, use appropriate size */}

        {/* Theme color is also set in viewport now, but this is a fallback */}
        <meta name="theme-color" content="#1E6A7B" />
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
