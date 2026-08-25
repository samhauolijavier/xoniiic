/*
 * "I'd like my own space to practice in."
 *
 * This collects a name, a WhatsApp number, an email and one sentence about what
 * they intend to do with it, then puts it in Discord for somebody to pick up.
 * It does not quote a price, does not provision anything, and does not reply.
 *
 * The last field is the reason the form exists. Somebody practising gets the
 * private space; somebody already running a client's marketing gets pointed at
 * an account in their own name instead. Asking on the form means whoever
 * answers already knows which conversation they are having, rather than
 * spending three messages finding out.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'

/**
 * Enough to stop a bot hammering the webhook, in memory rather than in the
 * database — a serverless instance is short-lived, so this is a speed bump and
 * not a guarantee. The honeypot below does most of the real work.
 */
const seen = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 3

function overLimit(ip: string): boolean {
  const now = Date.now()
  const hits = (seen.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  hits.push(now)
  seen.set(ip, hits)
  // Unbounded growth would be a slow leak on a long-lived instance.
  if (seen.size > 500) {
    Array.from(seen.entries()).forEach(([key, times]) => {
      if (times.every((t: number) => now - t > WINDOW_MS)) seen.delete(key)
    })
  }
  return hits.length > MAX_PER_WINDOW
}

/** Loose on purpose. People write +63, 09xx, and spaces, and all of them reach. */
function looksLikeAPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

function looksLikeAnEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (overLimit(ip)) {
    return NextResponse.json(
      { error: 'That has gone through already. Give us a little time to reply.' },
      { status: 429 }
    )
  }

  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  // A field positioned off-screen and left empty by anybody with eyes. Bots
  // fill every input they find, so a value here is the clearest signal we get —
  // and it answers 200 so the bot has no error to learn from.
  if (String(raw.website ?? '').trim()) {
    return NextResponse.json({ message: 'Thanks — we will be in touch.' })
  }

  const name = String(raw.name ?? '').trim().slice(0, 80)
  const whatsapp = String(raw.whatsapp ?? '').trim().slice(0, 40)
  const email = String(raw.email ?? '').trim().slice(0, 120)
  const useCase = String(raw.useCase ?? '').trim().slice(0, 600)

  if (!name) return NextResponse.json({ error: 'We need a name to call you by.' }, { status: 400 })
  if (!looksLikeAPhoneNumber(whatsapp)) {
    return NextResponse.json(
      { error: 'That does not look like a WhatsApp number. Include the area code — 09xx or +63.' },
      { status: 400 }
    )
  }
  if (!looksLikeAnEmail(email)) {
    return NextResponse.json({ error: 'That does not look like an email address.' }, { status: 400 })
  }
  if (useCase.length < 15) {
    return NextResponse.json(
      { error: 'Tell us a little about what you want to build — a sentence is plenty.' },
      { status: 400 }
    )
  }

  // Noted if they happen to be signed in, so whoever replies can look at the
  // profile before answering. Not required — somebody can ask before joining.
  const session = await getServerSession(authOptions)
  const me = session?.user as { id?: string; email?: string } | undefined

  const sent = await notifyDiscord({
    title: 'Wants their own practice space',
    description: useCase,
    tone: 'action',
    fields: [
      { name: 'Name', value: name, inline: true },
      { name: 'WhatsApp', value: whatsapp, inline: true },
      { name: 'Email', value: email, inline: true },
      {
        name: 'Account',
        value: me?.id ? `Signed in as ${me.email ?? me.id}` : 'Not signed in',
        inline: false,
      },
    ],
  })

  if (!sent) {
    // Nowhere to put it means nobody will ever see it, and telling somebody
    // "we will be in touch" when the message went nowhere is the one outcome
    // worth avoiding.
    console.error('[private-space] Discord notify failed — request dropped', { name, email })
    return NextResponse.json(
      { error: 'We could not get that through just now. Please try again in a few minutes.' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    message: 'Got it. Someone will message you on WhatsApp — usually within a day.',
  })
}
