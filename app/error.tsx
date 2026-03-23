'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="text-3xl sm:text-4xl font-black text-brand-text mb-3">
          Something went <span className="gradient-text">wrong</span>
        </h1>
        <p className="text-brand-muted mb-8 max-w-md mx-auto">
          We hit an unexpected error. This is usually temporary — try refreshing or come back in a moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary px-6 py-2.5">
            Try Again
          </button>
          <Link href="/" className="btn-secondary px-6 py-2.5">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
