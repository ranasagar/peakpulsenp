
import type {NextConfig} from 'next';

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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'catalog-resize-images.thedoublef.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.thenorthface.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thepipebox.com', // Added new hostname
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
