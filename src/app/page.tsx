
// src/app/page.tsx
// REMOVED "use client" from the top of the file

import MainLayout from '@/components/layout/main-layout';
import HomePageContent from '@/components/home/home-page-content'; // Import the new Client Component
import type { Metadata } from 'next';

// Static metadata for the homepage - This is now valid as the file is a Server Component by default
export const metadata: Metadata = {
  title: 'Peak Pulse - Nepali Craftsmanship Meets Contemporary Streetwear',
  description: 'Discover Peak Pulse, a Nepali clothing brand blending traditional craftsmanship with contemporary streetwear. Shop unique, high-quality apparel, ethically made in Nepal.',
  keywords: ['Peak Pulse', 'Nepali clothing', 'streetwear', 'Kathmandu fashion', 'Himalayan style', 'ethical fashion Nepal', 'sustainable apparel Kathmandu'],
  openGraph: {
    title: 'Peak Pulse - Nepali Craftsmanship Meets Contemporary Streetwear',
    description: 'Ethically crafted apparel blending Nepali heritage with modern style. Explore our latest collections.',
    images: [
      {
        url: '/og-homepage.png', // Replace with an actual path to a specific OG image for the homepage
        width: 1200,
        height: 630,
        alt: 'Peak Pulse Homepage',
      },
    ],
  },
};

// This is the Server Component
export default function RootPage() {
  // Data fetching for initial content could happen here and be passed to HomePageContent
  // For example:
  // const initialContent = await getHomepageContent(); // (getHomepageContent would need to be a server function)
  // <HomePageContent initialContent={initialContent} />

  return (
    <MainLayout>
      <HomePageContent />
    </MainLayout>
  );
}
