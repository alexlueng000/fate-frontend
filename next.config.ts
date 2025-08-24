import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 把你实际访问的来源都写上（含协议与端口）
    allowedDevOrigins: [
      'http://119.29.135.234',
      'http://119.29.135.234:80',
      'http://119.29.135.234:3000',
      // 如果用 https，也加上：
      // 'https://119.29.135.234'
    ],
  },
};

export default nextConfig;