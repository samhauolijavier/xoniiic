import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import { notifyDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'

// Long enough to say something a reader can use, short enough that nobody is
// writing an essay on their phone. A one-line "great platform!" is worth less
// than nothing — it reads as solicited, which is the exact impression a
// testimonial page has to avoid.
const MIN_BODY = 80
const MAX_BODY = 1200

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user as { id: string }

  try {
    const mine = await withRetry(() => db.testimonial.findFirst({
      where: { userId: me.id },
      orderBy: { createdAt: 'desc' },
    }))
    return NextResponse.json({ testimonial: mine })
  } catch (error) {
    console.error('Testimonial fetch error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}

/**
 * Accepts a video URL only if it points at our own storage.
 *
 * The field is written by the client, and a testimonial is rendered in a video
 * element on the homepage — so an unchecked value here is a way to have us host
 * somebody else's content under our name. It has to look like the public URL
 * Supabase just handed out for this bucket, or it does not count.
 */
function acceptOwnVideoUrl(raw: unknown): string | null {
  const value = String(raw ?? '').trim()
  if (!value) return null

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null

  try {
    const url = new URL(value)
    const expected = new URL(base)
    if (url.protocol !== 'https:') return null
    if (url.host !== expected.host) return null
    if (!url.pathname.includes('/testimonials/')) return null
    return value
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user as { id: string }

  const raw = await req.json().catch(() => ({}))
  const body = String(raw.body ?? '').trim()
  const roleTitle = String(raw.roleTitle ?? '').trim() || null
  const company = String(raw.company ?? '').trim() || null
  const consentPublic = raw.consentPublic !== false
  // Only ever a URL in our own Supabase bucket. The client sends back what the
  // signed-upload route told it to use, and anything else is discarded —
  // otherwise this field is an open invitation to embed a video from anywhere.
  const videoUrl = acceptOwnVideoUrl(raw.videoUrl)

  if (body.length < MIN_BODY) {
    return NextResponse.json({
      error: `A little more, please — at least ${MIN_BODY} characters. What kind of work do you do, and how did it come about?`,
    }, { status: 400 })
  }
  if (body.length > MAX_BODY) {
    return NextResponse.json({ error: `That is longer than ${MAX_BODY} characters. Trim it down.` }, { status: 400 })
  }
  if (!consentPublic) {
    return NextResponse.json({
      error: 'We can only use it if you are happy for it to be public. Nothing goes on the site without that.',
    }, { status: 400 })
  }

  try {
    const existing = await withRetry(() => db.testimonial.findFirst({
      where: { userId: me.id },
      orderBy: { createdAt: 'desc' },
    }))

    if (existing?.state === 'pending') {
      return NextResponse.json({ error: 'You already have one waiting to be read. We will get to it.' }, { status: 409 })
    }
    if (existing?.state === 'approved') {
      return NextResponse.json({ error: 'Yours is already live on the site. Thank you.' }, { status: 409 })
    }

    // A rejected one is edited in place rather than piling up rows, so the
    // reward check has a single record to look at.
    const saved = existing
      ? await withRetry(() => db.testimonial.update({
          where: { id: existing.id },
          data: { body, roleTitle, company, consentPublic, videoUrl, state: 'pending', reviewNote: null },
        }))
      : await withRetry(() => db.testimonial.create({
          data: { userId: me.id, body, roleTitle, company, consentPublic, videoUrl },
        }))

    const person = await withRetry(() => db.user.findUnique({
      where: { id: me.id },
      select: { name: true, email: true },
    }))
    await notifyDiscord({
      title: 'Testimonial to read',
      description: body.slice(0, 300) + (body.length > 300 ? '…' : ''),
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'}/admin/testimonials`,
      tone: 'good',
      fields: [
        { name: 'Who', value: person?.name || 'No name yet', inline: true },
        { name: 'Role', value: roleTitle || '—', inline: true },
        { name: 'Company', value: company || '—', inline: true },
        { name: 'Video', value: videoUrl ? 'Yes — watch before approving' : 'Text only', inline: true },
      ],
    })

    return NextResponse.json({
      message: 'Got it. Once it is approved, your badge and 30 days appear automatically.',
      testimonial: saved,
    })
  } catch (error) {
    console.error('Testimonial submit error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}
