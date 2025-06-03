
import type { MetadataRoute } from 'next';
import type { Product, AdminCategory as Category, DesignCollaborationGallery } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '', // Homepage
    '/products',
    '/categories',
    '/our-story',
    '/contact',
    '/community',
    '/collaborations',
    '/cart',
    '/checkout', // Usually not indexed, but listed for completeness. Can be removed.
    '/careers',
    '/sustainability',
    '/shipping-returns',
    // Legal pages
    '/privacy-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : (route === '/products' || route === '/categories' ? 0.9 : 0.7),
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // Fetch products
    const productsRes = await fetch(`${APP_URL}/api/products`);
    if (productsRes.ok) {
      const products: Product[] = await productsRes.json();
      const productRoutes = products.map((product) => ({
        url: `${APP_URL}/products/${product.slug}`,
        lastModified: product.updatedAt || product.createdAt || new Date().toISOString(),
        changeFrequency: 'weekly' as 'weekly',
        priority: 0.8,
      }));
      dynamicRoutes = dynamicRoutes.concat(productRoutes);
    } else {
      console.warn(`Sitemap: Failed to fetch products, status: ${productsRes.status}`);
    }

    // Fetch categories
    const categoriesRes = await fetch(`${APP_URL}/api/categories`);
    if (categoriesRes.ok) {
      const categories: Category[] = await categoriesRes.json();
      const categoryRoutes = categories.map((category) => ({
        url: `${APP_URL}/products?category=${category.slug}`, // Assuming categories filter products page
        lastModified: category.updatedAt || category.createdAt || new Date().toISOString(),
        changeFrequency: 'weekly' as 'weekly',
        priority: 0.7,
      }));
      dynamicRoutes = dynamicRoutes.concat(categoryRoutes);
    } else {
      console.warn(`Sitemap: Failed to fetch categories, status: ${categoriesRes.status}`);
    }

    // Fetch design collaborations
    const collaborationsRes = await fetch(`${APP_URL}/api/design-collaborations`);
    if (collaborationsRes.ok) {
      const collaborations: DesignCollaborationGallery[] = await collaborationsRes.json();
      const collaborationRoutes = collaborations
        .filter(collab => collab.is_published) // Only include published collaborations
        .map((collab) => ({
          url: `${APP_URL}/collaborations/${collab.slug}`,
          lastModified: collab.updatedAt || collab.createdAt || new Date().toISOString(),
          changeFrequency: 'monthly' as 'monthly',
          priority: 0.6,
      }));
      dynamicRoutes = dynamicRoutes.concat(collaborationRoutes);
    } else {
      console.warn(`Sitemap: Failed to fetch design collaborations, status: ${collaborationsRes.status}`);
    }

  } catch (error) {
    console.error("Sitemap generation error fetching dynamic routes:", error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
