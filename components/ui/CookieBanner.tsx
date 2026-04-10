'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('vf-cookie-consent')
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('vf-cookie-consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-brand-muted leading-relaxed">
          This website uses cookies to enable essential site functionality and improve your experience.
          By continuing to use this site, you consent to our use of cookies. See our{' '}
          <Link href="/cookie-policy" className="text-brand-purple hover:text-purple-400 transition-colors underline">
            Cookie Policy
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-brand-purple hover:text-purple-400 transition-colors underline">
            Privacy Policy
          </Link>.
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={accept}
            className="btn-primary px-5 py-2 text-sm"
          >
            Accept
          </button>
          <button
            onClick={accept}
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
