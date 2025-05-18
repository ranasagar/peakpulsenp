
// This file now simply renders the content of the (main)/page.tsx
// The actual homepage content is in src/app/(main)/page.tsx
// and its layout is src/app/(main)/layout.tsx

import HomePageContent from './(main)/page';
import MainLayout from './(main)/layout';

export default function RootPage() {
  return (
    <MainLayout>
      <HomePageContent />
    </MainLayout>
  );
}
