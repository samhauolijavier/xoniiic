'use client'

import { useState, useEffect } from 'react'

// Module-level cache: shared across all VFLogo instances
let logoCache: { url: string | null; resolved: boolean } = { url: null, resolved: false }
let logoPromise: Promise<string | null> | null = null

function fetchLogoUrl(): Promise<string | null> {
  if (!logoPromise) {
    logoPromise = fetch('/api/site-settings')
      .then((r) => r.text())
      .then((text) => {
        if (!text) return null
        const data = JSON.parse(text)
        const url = data.logoUrl || null
        logoCache = { url, resolved: true }
        return url
      })
      .catch(() => {
        logoCache = { url: null, resolved: true }
        return null
      })
  }
  return logoPromise
}

export function VFLogo({
  className = '',
  size = 36,
  imageUrl,
}: {
  className?: string
  size?: number
  imageUrl?: string | null
}) {
  // If imageUrl is explicitly provided (e.g. branding page preview), use it directly
  const hasOverride = imageUrl !== undefined
  const [cachedUrl, setCachedUrl] = useState<string | null>(logoCache.resolved ? logoCache.url : null)
  const [resolved, setResolved] = useState(hasOverride || logoCache.resolved)

  useEffect(() => {
    if (hasOverride) return
    if (logoCache.resolved) {
      setCachedUrl(logoCache.url)
      setResolved(true)
      return
    }
    fetchLogoUrl().then((url) => {
      setCachedUrl(url)
      setResolved(true)
    })
  }, [hasOverride])

  // Determine the URL to render
  const renderUrl = hasOverride ? imageUrl : cachedUrl

  // While loading, show invisible placeholder of same dimensions to prevent layout shift
  if (!resolved) {
    return (
      <div
        style={{ height: size, width: size, minWidth: size }}
        className={className}
        aria-hidden
      />
    )
  }

  if (renderUrl) {
    return (
      <img
        src={renderUrl}
        alt="Virtual Freaks logo"
        style={{ height: size, width: 'auto' }}
        className={`object-contain ${className}`}
      />
    )
  }

  return (
    <svg
      width={size}
      height={Math.round(size * 0.9)}
      viewBox="0 0 100 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vf-bar" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a21caf" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <linearGradient id="vf-chev" x1="50" y1="26" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
      </defs>
      <polygon points="3,3  97,0  95,15  5,18" fill="url(#vf-bar)" />
      <polygon points="5,26  28,26  50,58  72,26  95,26  50,90" fill="url(#vf-chev)" />
    </svg>
  )
}
