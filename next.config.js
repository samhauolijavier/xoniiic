/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Zero errors. Warnings still build, so this catches real mistakes without
    // blocking a deploy over style.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // The project typechecks clean. Leaving this off means a broken deploy
    // fails here, in seconds, instead of in front of whoever just signed up.
    ignoreBuildErrors: false,
  },

  // Profiles live at /@username.
  //
  // It cannot be a folder: in the App Router an @-prefixed directory is a
  // parallel route slot, not a literal path segment. So the page stays at
  // app/talent/[username] and the pretty URL is mapped onto it.
  //
  // The rewrite is invisible — the address bar keeps /@username while the
  // talent page renders. The redirect sends every old /talent/... link to the
  // new address permanently, so anything already shared or indexed still
  // arrives. No loop: redirects are matched against the incoming URL, and
  // /@username never matches /talent/:username.
  async rewrites() {
    return [
      { source: '/@:username', destination: '/talent/:username' },
    ]
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

      // The form used to live at the singular. One letter from the public page,
      // which sent the first person who guessed to a 404. The invitation emails
      // carrying the old path have not gone out yet, but this costs nothing and
      // outlives anyone's memory of the rename.
      { source: '/testimonial', destination: '/testimonials/write', permanent: true },

      // Two pages advertising products that do not exist.
      //
      // /verified-partner said "coming soon! Stay tuned" and /premium sold a
      // subscription nobody can buy. A business owner evaluating the platform
      // finds one of them and learns the place is unfinished — which is a
      // worse outcome than the page simply not being there.
      //
      // Temporary, not permanent: these come back the day either product is
      // real. Delete the two lines below to restore them.
      { source: '/verified-partner', destination: '/hire', permanent: false },
      { source: '/verified-partner/success', destination: '/hire', permanent: false },
      { source: '/premium', destination: '/dashboard', permanent: false },
      { source: '/premium/success', destination: '/dashboard', permanent: false },
      // Profiles moved to /@username. Kept permanently so anything already
      // shared or indexed still arrives. Listed before the bare /talent rule
      // because the first match wins and this one is the specific case.
      { source: '/talent/:username', destination: '/@:username', permanent: true },
      { source: '/talent', destination: '/browse', permanent: true },
      { source: '/freelancers', destination: '/browse', permanent: true },
      { source: '/find-talent', destination: '/browse', permanent: true },
      { source: '/job-board', destination: '/jobs', permanent: true },
    ]
  },
}

module.exports = nextConfig
