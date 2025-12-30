// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // 在构建和启动时忽略 ESLint 报错
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Add path aliases
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname + '/app',
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.fateinsight.site/api/:path*', // 转发到 FastAPI
      },
    ];
  },
};

export default nextConfig;
