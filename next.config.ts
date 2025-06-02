
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // typescript: {
  //   ignoreBuildErrors: true, // It's better to fix type errors
  // },
  // eslint: {
  //   ignoreDuringBuilds: true, // It's better to fix lint errors
  // },
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
  // output: 'standalone', // Vercel handles output optimization, this can sometimes conflict.
  experimental: { // Temporarily removed to simplify for server startup debugging - RE-ENABLING
    allowedDevOrigins: [
        "https://6000-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev",
        "http://6000-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev",
        // It's good practice to include localhost as well if you ever run it locally without the proxy
        "http://localhost:6000", // Assuming port 6000 based on the pattern
        "http://localhost:9003"  // Default port for this app from package.json
    ],
  }
};

export default nextConfig;

