/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Scoped deliberately. This was hostname: '**', which let anyone pass any
    // URL on the internet through the image optimiser — an abuse vector that
    // bills to this account, and the one line most likely to produce a
    // surprise invoice once ads are running.
    //
    // Supabase serves user uploads through its own CDN; YouTube serves video
    // thumbnails for the resource section. Nothing else needs to be here, and
    // anything added later should be added on purpose.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
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
