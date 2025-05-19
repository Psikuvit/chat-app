/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.railway.app',
        pathname: '/uploads/**',
      }
    ],
  },
  output: 'standalone',
}

module.exports = nextConfig