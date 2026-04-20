import type { NextConfig } from 'next';
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin';

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
    minimumCacheTTL: 31536000,
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.optimization.minimizer.push(
        new ImageMinimizerPlugin({
          minimizer: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            implementation: ImageMinimizerPlugin.imageminMinify as any,
            options: {
              plugins: [
                ['imagemin-mozjpeg', { quality: 80, progressive: true }],
                ['imagemin-pngquant', { quality: [0.65, 0.8] }],
                ['imagemin-webp', { quality: 80 }],
              ],
            },
          },
        }),
      );
    }
    return config;
  },
  experimental: {
    optimizePackageImports: ['motion', 'lucide-react', '@typebot.io/react'],
    optimizeCss: true,
  },
};

export default config;
