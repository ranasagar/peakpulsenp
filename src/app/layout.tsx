import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/layout/theme-provider';

export const metadata: Metadata = {
  title: {
    default: 'Peak Pulse - Nepali Craftsmanship Meets Contemporary Streetwear',
    template: '%s | Peak Pulse',
  },
  description: 'Discover Peak Pulse, a Nepali clothing brand blending traditional craftsmanship with contemporary streetwear. Shop unique, high-quality apparel.',
  keywords: ['Peak Pulse', 'Nepali clothing', 'streetwear', 'fashion', 'contemporary design', 'traditional craftsmanship'],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
