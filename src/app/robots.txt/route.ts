
import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003';

export function GET(): Response {
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /account/
Disallow: /api/ # Generally disallow direct API access, adjust if specific API routes should be crawled
Disallow: /login/
Disallow: /register/

Sitemap: ${APP_URL}/sitemap.xml
`;
  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
