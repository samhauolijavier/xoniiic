import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl sm:text-9xl font-black gradient-text mb-4">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-3">
          Page Not Found
        </h1>
        <p className="text-brand-muted mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary px-6 py-2.5">
            Go Home
          </Link>
          <Link href="/browse" className="btn-secondary px-6 py-2.5">
            Browse Talent
          </Link>
        </div>
      </div>
    </div>
  )
}
