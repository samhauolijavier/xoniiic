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
    /*
     * A bar, not a panel.
     *
     * Three sentences of consent copy wrapped over four lines and took roughly
     * a third of a phone screen at every scroll position — sitting on top of
     * whatever the visitor was actually reading. Nobody reads a cookie notice;
     * they look for the button. So it says the necessary thing in one line,
     * puts the button where a thumb already is, and gets out of the way.
     *
     * Still the full disclosure: the links are the disclosure, and they are
     * where somebody who cares will look for them.
     */
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2.5 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-3xl mx-auto rounded-xl border border-white/12 bg-[#17121a]/95 backdrop-blur-md shadow-2xl px-4 py-3 flex items-center gap-3">
        <p className="flex-1 text-[13px] leading-snug text-white/65 min-w-0">
          We use cookies to keep the site working.{' '}
          <Link href="/cookie-policy" className="text-white/85 hover:text-white underline underline-offset-2">
            Cookies
          </Link>
          {' · '}
          <Link href="/privacy" className="text-white/85 hover:text-white underline underline-offset-2">
            Privacy
          </Link>
        </p>
        <button
          onClick={accept}
          className="flex-none rounded-full bg-white text-[#17121a] font-semibold text-[13px] px-4 py-2 hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
        <button
          onClick={accept}
          aria-label="Dismiss"
          className="flex-none text-white/45 hover:text-white transition-colors text-lg leading-none px-1"
        >
          &times;
        </button>
      </div>
    </div>
    )
}
