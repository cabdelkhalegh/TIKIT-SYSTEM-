/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone only for Docker, not for Vercel
  output: process.env.VERCEL ? undefined : 'standalone',
  reactStrictMode: true,
  typescript: {
    // Allow build with TS errors (will fix incrementally)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/uploads/**',
      },
    ],
  },
  // Removed rewrites - API is now same-origin
}

module.exports = nextConfig
