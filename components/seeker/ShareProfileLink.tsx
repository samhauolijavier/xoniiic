'use client'

import { useState } from 'react'

interface ShareProfileLinkProps {
  username: string
  compact?: boolean
}

export function ShareProfileLink({ username, compact = false }: ShareProfileLinkProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://virtualfreaks.com'
  const profileUrl = `${appUrl}/talent/${username}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = profileUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          title="Copy profile link"
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-brand-card border-brand-border text-brand-muted hover:border-brand-purple hover:text-brand-text'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Share
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Your Profile Link
      </h3>

      {/* URL display */}
      <div className="flex items-center gap-2 bg-brand-border/30 rounded-xl px-4 py-2.5 mb-3 border border-brand-border">
        <span className="text-xs text-brand-muted flex-1 truncate font-mono">{profileUrl}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl border transition-all ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-brand-card border-brand-border text-brand-text hover:border-brand-purple'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <a
          href={linkedinShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl bg-[#0077B5]/20 border border-[#0077B5]/40 text-[#0077B5] hover:bg-[#0077B5]/30 transition-all"
          title="Share on LinkedIn"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </a>
      </div>
    </div>
  )
}
