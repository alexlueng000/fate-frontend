import type { Configuration } from 'webpack';

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // 在构建和启动时忽略 ESLint 报错
    ignoreDuringBuilds: true,
  },
  webpack: (config: Configuration) => {
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
        destination: 'http://127.0.0.1:8000/api/:path*', // 转发到 FastAPI
      },
    ];
  },
};

export default nextConfig;