// next.config.ts
import type { NextConfig } from 'next';

// API 目标地址：
// - 必须通过环境变量 NEXT_PUBLIC_API_BASE 配置
// - 开发环境（前后端同机）: http://localhost:8000
// - 开发环境（前后端分离）: http://<后端服务器IP>:8000
// - 生产环境: https://api.fateinsight.site
// 注意：localhost 指的是运行前端的服务器，不是用户的浏览器
const API_DESTINATION = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',  // Docker 部署需要
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
        destination: `${API_DESTINATION}/api/:path*`, // 转发到 FastAPI
      },
    ];
  },
};

export default nextConfig;
