/*
 * The link, and something to say with it.
 *
 * People do not repost a URL on its own — they need a sentence around it, and
 * writing that sentence about yourself is the part most people quietly skip.
 * So the copy button takes the whole post, not just the address, and the words
 * are about what they can do rather than what they want.
 *
 * The LinkedIn and Facebook buttons open a share dialog with the link
 * pre-filled. Neither network lets a site prefill the text, so the caption is
 * copied first and pasted by them — saying so plainly beats a button that
 * silently drops half of what it promised.
 */
'use client'

import { useState } from 'react'

export function ShareProfileCard({
  username,
  name,
  headline,
}: {
  username: string
  name: string | null
  headline: string | null
}) {
  const [copied, setCopied] = useState<'link' | 'post' | null>(null)

  const url = `https://virtualfreaks.co/@${username}`
  const post = [
    headline
      ? `I'm ${name?.split(' ')[0] ?? 'available'} — ${headline}.`
      : `I'm ${name?.split(' ')[0] ?? 'available'} and I'm open to remote work.`,
    '',
    'My full profile is here — what I do, what I have built, and how to reach me:',
    url,
  ].join('\n')

  async function copy(what: 'link' | 'post') {
    try {
      await navigator.clipboard.writeText(what === 'link' ? url : post)
    } catch {
      // Clipboard access is refused inside some in-app browsers, which is
      // exactly where people open links from chat. The text is on screen and
      // selectable, so this is a missing convenience rather than a dead end.
      return
    }
    setCopied(what)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="card p-5 mb-6">
      <h2 className="font-semibold mb-1.5">Share your profile</h2>
      <p className="text-sm text-brand-muted leading-relaxed mb-4">
        This page is yours to post anywhere — LinkedIn, Facebook, a CV, a reply to a job ad. It
        works as a portfolio link for anyone, whether they have a Virtual Freaks account or not.
      </p>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <code className="text-xs bg-brand-bg border border-brand-border rounded-lg px-3 py-2 flex-1 min-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
          virtualfreaks.co/@{username}
        </code>
        <button className="btn-secondary text-sm" onClick={() => copy('link')}>
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-bg p-3 mb-3">
        <p className="text-xs text-brand-muted mb-2">Something to post with it:</p>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post}</p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <button className="btn-primary text-sm" onClick={() => copy('post')}>
          {copied === 'post' ? 'Copied' : 'Copy post'}
        </button>
        <a
          className="btn-secondary text-sm"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
        >
          Open LinkedIn
        </a>
        <a
          className="btn-secondary text-sm"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
        >
          Open Facebook
        </a>
      </div>

      <p className="text-xs text-brand-muted mt-3 leading-relaxed">
        Copy the post first — LinkedIn and Facebook don&apos;t let us fill the text in for you, so
        paste it once the window opens.
      </p>
    </div>
  )
}
