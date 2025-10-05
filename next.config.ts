import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains for scraped images
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP domains for scraped images
      }
    ],
  },
}

export default nextConfig
