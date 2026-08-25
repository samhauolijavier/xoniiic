/*
 * Where a crashed page reports itself.
 *
 * The error boundary logged to the browser console, which means the only person
 * who ever saw the cause was the person it happened to — and they are the one
 * least able to do anything with it. "Not loading for some people" arrived as a
 * screenshot rather than an alert, which is the wrong way round.
 *
 * Nothing here can break the page it is reporting on: it is called from a
 * boundary that has already failed once, so every path returns quietly.
 */
import { NextRequest, NextResponse } from 'next/server'
import { notifyDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'

/**
 * One page breaking for fifty people should be one message, not fifty. Keyed by
 * path and message so a different fault still gets through immediately.
 */
const lastSent = new Map<string, number>()
const QUIET_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = String(body.message ?? 'Unknown error').slice(0, 300)
    const path = String(body.path ?? 'unknown').slice(0, 200)
    const digest = String(body.digest ?? '').slice(0, 60)

    const key = `${path}::${message}`
    const now = Date.now()
    const seenAt = lastSent.get(key)
    if (seenAt && now - seenAt < QUIET_MS) return NextResponse.json({ ok: true })
    lastSent.set(key, now)
    if (lastSent.size > 200) lastSent.clear()

    await notifyDiscord({
      title: 'A page crashed',
      description: message,
      tone: 'warn',
      fields: [
        { name: 'Where', value: path, inline: false },
        // Next.js strips server error messages in production and leaves this
        // id behind — it is the only thing tying the crash to the server log.
        ...(digest ? [{ name: 'Digest', value: digest, inline: true }] : []),
      ],
    })
  } catch {
    // A reporting failure must never become a second error on a broken page.
  }
  return NextResponse.json({ ok: true })
}
