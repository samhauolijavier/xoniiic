import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Lightning bolt icon */}
        <div className="text-6xl mb-4">
          <span className="inline-block animate-bounce">&#9889;</span>
        </div>

        {/* 404 number */}
        <div className="text-8xl sm:text-9xl font-black gradient-text mb-2 leading-none">404</div>

        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-3">
          Page Not <span className="gradient-text italic">Found</span>
        </h1>

        <p className="text-brand-muted mb-8 max-w-md mx-auto leading-relaxed">
          This page doesn&apos;t exist or has been moved. Let&apos;s get you back to finding amazing talent.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-orange text-white font-medium hover:opacity-90 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:border-brand-purple hover:text-brand-text font-medium transition-all"
          >
            Browse Talent
          </Link>
        </div>

        {/* Decorative gradient bar */}
        <div className="mt-12 mx-auto w-32 h-1 rounded-full bg-gradient-to-r from-brand-purple to-brand-orange opacity-30" />
      </div>
    </div>
  )
}
