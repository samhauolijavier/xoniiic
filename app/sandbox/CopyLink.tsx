'use client'

import { useState } from 'react'

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard access is refused in some in-app browsers, which is exactly
      // where people open links from chat. The text is on screen and
      // selectable, so this is a missing convenience, not a dead end.
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ref-row">
      <code>{url.replace(/^https?:\/\//, '')}</code>
      <button className="sbtn ghost" type="button" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
