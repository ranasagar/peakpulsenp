
import type {NextConfig} from 'next';
// @ts-ignore
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in dev mode
  // You might want to add more PWA options here, like runtime caching strategies
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*', 
      },
      {
        protocol: 'http',
        hostname: '*', 
      },
    ],
  },
  output: 'standalone', 
  experimental: {
    allowedDevOrigins: [
        "https://9003-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev"
    ],
  }
};

export default withPWA(nextConfig);
