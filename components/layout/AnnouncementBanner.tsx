'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function AnnouncementBanner() {
  const [enabled, setEnabled] = useState(false)
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [style, setStyle] = useState('gradient')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.bannerEnabled === 'true' && data.bannerText) {
          setEnabled(true)
          setText(data.bannerText)
          if (data.bannerLink) setLink(data.bannerLink)
          if (data.bannerStyle) setStyle(data.bannerStyle)
        }
      })
      .catch(() => {})
  }, [])

  if (!enabled || !text || dismissed) return null

  const styleClasses =
    style === 'gradient'
      ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
      : style === 'info'
      ? 'bg-blue-900/60 text-blue-200 border-b border-blue-700/40'
      : style === 'warning'
      ? 'bg-amber-900/60 text-amber-200 border-b border-amber-700/40'
      : 'bg-emerald-900/60 text-emerald-200 border-b border-emerald-700/40'

  const content = (
    <div className={`relative px-4 py-2 text-center text-sm font-medium ${styleClasses}`}>
      <span>{text}</span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(true) }}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )

  if (link) {
    return (
      <Link href={link} className="block hover:brightness-110 transition-all">
        {content}
      </Link>
    )
  }

  return content
}
