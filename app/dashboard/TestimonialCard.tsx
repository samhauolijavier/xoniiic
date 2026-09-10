/*
 * "Share your story" — the box the invitation email points at.
 *
 * It leads with what the person gets, not with what we want, because they are
 * being asked for a favour and the ask should be worth their two minutes. And
 * it says plainly that honest is better than glowing: a page of perfect
 * reviews reads as solicited, which is the one thing testimonials cannot
 * afford to look like.
 */
'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import {
  PROMPT_GROUPS,
  PROMPTS_TO_ANSWER,
  NO_NAMES_RULE,
  EXAMPLE_STRONG,
  LENGTH_GUIDE,
} from '@/lib/testimonial-prompts'

interface Testimonial {
  id: string
  body: string
  roleTitle: string | null
  company: string | null
  videoUrl: string | null
  state: 'pending' | 'approved' | 'rejected'
  reviewNote: string | null
}

const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const VIDEO_MAX_MB = 50

const MIN_BODY = 80

export function TestimonialCard({ alwaysOpen = false }: { alwaysOpen?: boolean } = {}) {
  const [existing, setExisting] = useState<Testimonial | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(alwaysOpen)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const [body, setBody] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [company, setCompany] = useState('')
  const [consent, setConsent] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  // Null when nothing is uploading; 0-100 while it is. Philippine mobile data
  // makes even a 50MB upload a genuinely long wait, and a form that looks
  // frozen for two minutes gets abandoned or submitted twice.
  const [videoPct, setVideoPct] = useState<number | null>(null)
  const [videoError, setVideoError] = useState('')
  const toast = useToast()
  // The email carrying these questions is long gone by the time somebody sits
  // down to write. Closed by default so the card stays a card.
  const [showPrompts, setShowPrompts] = useState(false)

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(d => {
        if (d.testimonial) {
          setExisting(d.testimonial)
          setVideoUrl(d.testimonial.videoUrl ?? null)
          if (d.testimonial.state === 'rejected') {
            setBody(d.testimonial.body)
            setRoleTitle(d.testimonial.roleTitle ?? '')
            setCompany(d.testimonial.company ?? '')
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(''); setDone('')
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, roleTitle, company, consentPublic: consent, videoUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'That did not send.'); return }
      setDone(data.message)
      setExisting(data.testimonial)
      setOpen(false)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function pickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same file twice still fires
    if (!file) return

    setVideoError('')

    if (!VIDEO_TYPES.includes(file.type)) {
      setVideoError('That is not a video we can play. Most phones record MP4 or MOV, and both work.')
      return
    }
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setVideoError(
        `That file is ${(file.size / 1024 / 1024).toFixed(0)}MB, and the limit is ${VIDEO_MAX_MB}MB. Open "How to make your video smaller" just below — trimming the ends usually does it in about thirty seconds.`
      )
      return
    }

    setVideoPct(0)
    try {
      // We ask for permission to write to one path, then send the file
      // straight to storage. It never passes through our server, which is the
      // only way a file this size gets uploaded at all.
      const res = await fetch('/api/testimonials/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      })
      const data = await res.json()
      if (!res.ok) { setVideoError(data.error ?? 'Could not start the upload.'); setVideoPct(null); return }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', data.uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setVideoPct(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))))
        xhr.onerror = () => reject(new Error('network'))
        xhr.send(file)
      })

      setVideoUrl(data.publicUrl)
      toast.success('Video uploaded.')
    } catch (err) {
      /*
       * Storage has its own ceiling, and it is not the one checked above.
       *
       * The size check on this page is ours. Supabase then applies the bucket's
       * own limit, which can be lower — and when it refuses, it does so with a
       * 413 after the whole file has already gone up the wire. That used to be
       * reported as "a stronger connection usually fixes it", which sent people
       * to hunt a wifi problem that was not there while the real answer was that
       * the file was simply too big.
       */
      const status = err instanceof Error ? err.message : ''
      setVideoError(
        status === '413'
          ? `Storage refused the file at ${(file.size / 1024 / 1024).toFixed(0)}MB even though it passed the check on this page, which means the two limits have drifted apart. Trim the video and try again, and please tell Spencer — that mismatch is ours to fix, not yours.`
          : 'The upload did not finish. A stronger connection usually fixes it.'
      )
    } finally {
      setVideoPct(null)
    }
  }

  if (loading) return null

  if (existing?.state === 'approved') {
    return (
      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-1.5">Your story is on the site</h2>
        <p className="text-sm text-brand-muted leading-relaxed">
          Thank you — it is doing more work than anything we could write ourselves. Your{' '}
          <strong className="text-brand-text">Placed through Virtual Freaks</strong> badge is on your
          public profile, and your 30 days have been added.
        </p>
      </div>
    )
  }

  if (existing?.state === 'pending') {
    return (
      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-1.5">Your story is with us</h2>
        <p className="text-sm text-brand-muted leading-relaxed">
          We are reading it. Once it is approved your badge and 30 days appear here automatically —
          nothing else for you to do.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5 mb-6">
      <h2 className="font-semibold mb-1.5">Share your story</h2>
      <p className="text-sm text-brand-muted leading-relaxed mb-3">
        Business owners deciding whether to hire from here have no way to know it works until
        somebody who has done it says so. A few honest lines is plenty.
      </p>

      <div className="text-sm text-brand-muted mb-4 leading-relaxed">
        <strong className="text-brand-text">What you get:</strong> the{' '}
        <strong className="text-brand-text">Placed through Virtual Freaks</strong> badge on your
        public profile — employers look for it — and{' '}
        <strong className="text-brand-text">30 days of practice account</strong>.
      </div>

      {existing?.state === 'rejected' && existing.reviewNote && (
        <p className="text-sm mb-4 px-3 py-2.5 rounded-lg bg-brand-purple/[0.06] border border-brand-purple/30 leading-relaxed">
          <strong>Sent back:</strong> {existing.reviewNote}
        </p>
      )}

      {!open && !alwaysOpen ? (
        <button className="btn-primary" onClick={() => setOpen(true)}>
          {existing?.state === 'rejected' ? 'Edit and resend' : 'Write a few lines'}
        </button>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <div className="rounded-lg border border-brand-purple/30 bg-brand-purple/[0.04] px-3.5 py-3">
            <p className="text-sm leading-relaxed">
              <strong className="text-brand-text">Pick {PROMPTS_TO_ANSWER} questions</strong> from at
              least two different sections and answer them honestly. {LENGTH_GUIDE}
            </p>
            <p className="text-sm text-brand-muted leading-relaxed mt-2">
              <strong className="text-brand-text">One rule:</strong> {NO_NAMES_RULE}
            </p>
            <button
              type="button"
              onClick={() => setShowPrompts(v => !v)}
              className="text-sm text-brand-purple hover:text-brand-pink transition-colors underline underline-offset-2 mt-2.5"
              aria-expanded={showPrompts}
            >
              {showPrompts ? 'Hide the questions' : 'Show the questions'}
            </button>

            {showPrompts && (
              <div className="grid gap-4 mt-4 pt-4 border-t border-brand-purple/20">
                {PROMPT_GROUPS.map(g => (
                  <div key={g.key}>
                    <p className="text-sm font-semibold text-brand-text">{g.title}</p>
                    <p className="text-xs text-brand-muted italic mb-1.5">{g.hint}</p>
                    <ul className="list-disc pl-5 grid gap-1">
                      {g.questions.map(q => (
                        <li key={q} className="text-sm text-brand-muted leading-relaxed">{q}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="pt-3 border-t border-brand-purple/20">
                  <p className="text-sm font-semibold text-brand-text mb-1.5">
                    What a useful one looks like
                  </p>
                  <p className="text-sm text-brand-muted leading-relaxed border-l-2 border-brand-purple pl-3">
                    &ldquo;{EXAMPLE_STRONG}&rdquo;
                  </p>
                  <p className="text-xs text-brand-muted leading-relaxed mt-2">
                    Numbers, a timeframe, and one honest downside. The rough bits are what make the
                    rest believable.
                  </p>
                </div>
              </div>
            )}
          </div>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Your story</span>
            <textarea
              className="w-full" rows={5} value={body} onChange={e => setBody(e.target.value)}
              placeholder="Answer the questions above in your own words. Honest beats glowing — a page of perfect reviews convinces nobody."
              required
            />
            <span className="block text-xs text-brand-muted mt-1">
              {body.length < MIN_BODY
                ? `${MIN_BODY - body.length} more characters`
                : `${body.length} characters`}
            </span>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">
                Your role <span className="text-brand-muted font-normal">— optional</span>
              </span>
              <input className="w-full" value={roleTitle} onChange={e => setRoleTitle(e.target.value)}
                placeholder="Executive Assistant" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">
                Who you work for <span className="text-brand-muted font-normal">— optional</span>
              </span>
              <input className="w-full" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="A US real estate agency" />
              <span className="block text-xs text-brand-muted mt-1">
                The kind of business, not its name.
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-brand-border p-3.5">
            <p className="text-sm font-medium text-brand-text">
              Add a video <span className="text-brand-muted font-normal">— optional, and worth it</span>
            </p>
            <p className="text-xs text-brand-muted leading-relaxed mt-1 mb-3">
              Sixty seconds on your phone, saying the same thing in your own voice. A face and a
              real accent do more than any paragraph &mdash; and it does not need to be polished.
            </p>
            {/* Said before the file picker, not after a rejection. Somebody hit
                the limit, was told to shorten the video, and replied that she
                did not know how — which is a question we can simply answer up
                front rather than leaving people to search for it. */}
            <p className="text-xs text-brand-muted leading-relaxed mb-2">
              <span className="text-brand-text font-medium">Keep it under {VIDEO_MAX_MB}MB.</span>{' '}
              That is about 45 seconds filmed at 1080p, or 90 seconds at 720p.
            </p>

            <details className="mb-3 group">
              {/* list-none alone does not do it in Safari, which draws its own
                  marker through a pseudo-element. Both are needed. */}
              <summary className="text-xs text-brand-purple hover:text-brand-pink cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span className="underline underline-offset-2 group-open:hidden">How to make your video smaller</span>
                <span className="underline underline-offset-2 hidden group-open:inline">Hide</span>
              </summary>

              <div className="text-xs text-brand-muted leading-relaxed mt-2.5 grid gap-2.5 pl-0.5">
                <p>
                  <span className="text-brand-text font-medium">1 &middot; Trim it &mdash; try this first.</span>{' '}
                  Nothing to install and no loss of quality.
                  <br />
                  <span className="text-brand-text">iPhone:</span> Photos &rarr; open the video &rarr;
                  Edit &rarr; drag the arrows at each end inwards &rarr; Done &rarr; Save as New Clip.
                  <br />
                  <span className="text-brand-text">Android:</span> Google Photos &rarr; open the
                  video &rarr; Edit &rarr; drag the ends in &rarr; Save copy.
                </p>
                <p>
                  <span className="text-brand-text font-medium">2 &middot; Film smaller next time.</span>{' '}
                  4K is four times the size of 1080p for no benefit here. On iPhone:
                  Settings &rarr; Camera &rarr; Record Video &rarr; 1080p at 30fps.
                </p>
                <p>
                  <span className="text-brand-text font-medium">3 &middot; On a computer, if it is still too big.</span>{' '}
                  <span className="text-brand-text">Mac:</span> open it in QuickTime &rarr; File &rarr;
                  Export As &rarr; 720p. <span className="text-brand-text">Windows:</span>{' '}
                  <a
                    href="https://handbrake.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-purple hover:text-brand-pink underline underline-offset-2"
                  >
                    HandBrake
                  </a>{' '}
                  is free &mdash; choose the &ldquo;Fast 720p30&rdquo; preset.
                </p>
                <p className="text-brand-muted/80">
                  Everything above happens on your own phone or computer. We would rather you did not
                  use a &ldquo;compress video online&rdquo; site &mdash; your face and voice are in
                  this file, and those sites work by uploading it to a stranger&rsquo;s server.
                </p>
              </div>
            </details>

            {videoUrl ? (
              <div className="grid gap-2">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={videoUrl} controls playsInline className="w-full max-w-sm rounded-lg bg-black" />
                <button
                  type="button"
                  onClick={() => setVideoUrl(null)}
                  className="text-sm text-red-600 hover:underline justify-self-start"
                >
                  Remove video
                </button>
              </div>
            ) : videoPct !== null ? (
              <div>
                <div className="h-1.5 rounded-full bg-brand-border overflow-hidden">
                  <div
                    className="h-full bg-brand-purple transition-[width] duration-200"
                    style={{ width: `${videoPct}%` }}
                  />
                </div>
                <p className="text-xs text-brand-muted mt-1.5 tabular-nums">
                  Uploading… {videoPct}%. Keep this page open.
                </p>
              </div>
            ) : (
              <label className="btn-secondary text-sm inline-block cursor-pointer">
                Choose a video
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="sr-only"
                  onChange={pickVideo}
                />
              </label>
            )}

            {videoError && <p className="text-sm text-red-600 mt-2 leading-relaxed">{videoError}</p>}
          </div>

          <label className="flex items-start gap-2.5 text-sm text-brand-muted leading-relaxed">
            <input type="checkbox" className="mt-1" checked={consent}
              onChange={e => setConsent(e.target.checked)} />
            <span>
              I am happy for this to appear publicly on virtualfreaks.co with my name and profile
              photo. I can ask for it to be removed at any time.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              className="btn-primary"
              type="submit"
              disabled={busy || videoPct !== null || body.trim().length < MIN_BODY}
            >
              {busy ? 'Sending…' : videoPct !== null ? 'Waiting for the video…' : 'Send it'}
            </button>
            {!alwaysOpen && (
              <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
            )}
          </div>
        </form>
      )}

      {done && <p className="text-sm text-brand-purple mt-3">{done}</p>}
    </div>
  )
}
