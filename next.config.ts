
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
        hostname: '*', // Allows all hostnames for HTTPS
      },
      {
        protocol: 'http',
        hostname: '*', // Allows all hostnames for HTTP
      },
    ],
  },
  output: 'standalone', // Add this line
};

export default nextConfig;
