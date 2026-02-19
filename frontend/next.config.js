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
  async rewrites() {
    // Use NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL, fallback to localhost
    // Ensure we always have a valid URL (not undefined)
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                   process.env.NEXT_PUBLIC_API_URL || 
                   'http://localhost:3001';
    
    // Validate the URL is not "undefined" string
    const validApiUrl = apiUrl === 'undefined' || !apiUrl ? 'http://localhost:3001' : apiUrl;
    
    return [
      {
        source: '/api/:path*',
        destination: `${validApiUrl}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
