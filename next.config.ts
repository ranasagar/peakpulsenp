
import type {NextConfig} from 'next';
// @ts-ignore
// import withPWAInit from 'next-pwa'; // Temporarily commenting out PWA

// const pwaConfig = {
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development' || !!process.env.VERCEL, // Disable PWA in dev and on Vercel builds
// };

// const withPWA = withPWAInit(pwaConfig);

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
        hostname: '**', // Allows all hostnames for https
      },
      {
        protocol: 'http',
        hostname: '**', // Allows all hostnames for http (use with caution)
      },
    ],
  },
  // output: 'standalone', // Temporarily removed for Vercel build troubleshooting
  experimental: {
    allowedDevOrigins: [
        "https://9003-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev",
        "http://9003-firebase-studio-1747567658921.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev",
    ],
  }
};

// export default withPWA(nextConfig); // Temporarily export without PWA
export default nextConfig; // Exporting the plain config
