
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { CartProvider } from '@/context/cart-context';
import { SocialMessagingWidget } from '@/components/social/social-messaging-widget';
import Script from 'next/script';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Peak Pulse - Nepali Craftsmanship Meets Contemporary Streetwear',
    template: '%s | Peak Pulse',
  },
  description: 'Discover Peak Pulse, a Nepali clothing brand blending traditional craftsmanship with contemporary streetwear. Shop unique, high-quality apparel, ethically made in Nepal.',
  keywords: ['Peak Pulse', 'Nepali clothing', 'streetwear', 'fashion', 'Kathmandu', 'Nepal', 'Himalayan fashion', 'ethical fashion', 'sustainable apparel', 'contemporary design', 'traditional craftsmanship'],
  applicationName: 'Peak Pulse',
  authors: [{ name: 'Peak Pulse Team', url: APP_URL }],
  creator: 'Peak Pulse',
  publisher: 'Peak Pulse',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'Peak Pulse',
    title: 'Peak Pulse - Nepali Craftsmanship Meets Contemporary Streetwear',
    description: 'Ethically crafted apparel blending Nepali heritage with modern style.',
    images: [
      {
        url: `${APP_URL}/og-image.png`, // Replace with your actual default OG image URL
        width: 1200,
        height: 630,
        alt: 'Peak Pulse - Nepali Fashion Reimagined',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peak Pulse - Nepali Craftsmanship Meets Contemporary Streetwear',
    description: 'Ethically crafted apparel blending Nepali heritage with modern style.',
    images: [`${APP_URL}/twitter-image.png`], // Replace with your actual Twitter image URL
    // creator: '@YourTwitterHandle', // Optional: Add your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png', // Example, ensure these files exist
    apple: '/apple-touch-icon.png', // Example
  },
  // manifest: '/manifest.json', // If you have a PWA manifest
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
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
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Peak Pulse",
    "url": APP_URL,
    "logo": `${APP_URL}/logo-schema.png`, // Replace with your actual logo URL for schema
    "sameAs": [ // Add your social media profile URLs here
      "https://www.facebook.com/peakpulsenp",
      "https://www.instagram.com/peakpulsenp",
      "https://twitter.com/peakpulse"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": APP_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${APP_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
              <SocialMessagingWidget />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
