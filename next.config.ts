
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows all hostnames for https
      },
      {
        protocol: 'http',
        hostname: '**', // Allows all hostnames for http (use with caution)
      },
    ],
  },
  experimental: { 
    allowedDevOrigins: [
        "https://6000-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev",
        "http://6000-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev",
        "http://localhost:6000",
        "http://localhost:9003"
    ],
  },
  async headers() {
    return [
      // Rule specific to font files under /_next/static/media/
      // This rule should come first to ensure it's prioritized.
      {
        source: '/_next/static/media/:file(.+\\.(woff2|woff|ttf|otf|eot)$)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' }, // Fonts primarily need GET and OPTIONS for preflight
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Range' }, // Range might be used by some browsers
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }, // Aggressive caching
        ],
      },
      // General rule for other _next/static assets (like JS, CSS chunks)
      // This is less specific than the font rule above but more specific than the general catch-all below.
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      // General catch-all rule for other paths (APIs, pages)
      // This should come LAST.
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS, PATCH, DELETE, POST, PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' }, // Added Authorization
        ],
      },
    ];
  },
};

export default nextConfig;
