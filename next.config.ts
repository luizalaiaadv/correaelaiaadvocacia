import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
  },
  experimental: {
    optimizePackageImports: ['motion', 'lucide-react', '@typebot.io/react'],
  },
};

export default config;
