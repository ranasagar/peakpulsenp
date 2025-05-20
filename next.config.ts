
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
  experimental: {
    allowedDevOrigins: [
        "https://9003-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev"
    ],
  }
};

export default nextConfig;
