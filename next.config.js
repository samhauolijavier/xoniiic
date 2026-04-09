/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Generate Prisma Client during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/talent', destination: '/browse', permanent: true },
      { source: '/freelancers', destination: '/browse', permanent: true },
      { source: '/find-talent', destination: '/browse', permanent: true },
      { source: '/job-board', destination: '/jobs', permanent: true },
    ]
  },
}

module.exports = nextConfig
