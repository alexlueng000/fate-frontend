const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // 在构建和启动时忽略 ESLint 报错
    ignoreDuringBuilds: true,
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