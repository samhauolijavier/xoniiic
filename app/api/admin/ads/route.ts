import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ads = await db.adSlot.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ads })
  } catch (error) {
    console.error('Ads GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, placement, imageUrl, linkUrl, altText, advertiser, startsAt, endsAt, priority, audience } = body

    if (!name || !placement || !imageUrl || !linkUrl || !altText) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // A link typed as "theradcrm.com" is not a URL a browser will follow — it
    // resolves relative to this site and sends the click to a page that does
    // not exist. Adding the scheme here means nobody has to remember to.
    const href = /^https?:\/\//i.test(String(linkUrl).trim())
      ? String(linkUrl).trim()
      : `https://${String(linkUrl).trim()}`

    const starts = startsAt ? new Date(startsAt) : null
    const ends = endsAt ? new Date(endsAt) : null
    if (starts && ends && ends <= starts) {
      return NextResponse.json({ error: 'The end date has to be after the start date.' }, { status: 400 })
    }

    const ad = await db.adSlot.create({
      data: {
        name, placement, imageUrl, altText, advertiser,
        linkUrl: href,
        startsAt: starts,
        endsAt: ends,
        priority: Number.isFinite(Number(priority)) ? Math.trunc(Number(priority)) : 0,
        // Anything unrecognised falls back to everyone — a typo should widen
        // the audience, never silently hide a paid placement from both sides.
        audience: ['all', 'seeker', 'employer'].includes(String(audience)) ? String(audience) : 'all',
        active: true,
      },
    })

    return NextResponse.json({ ad }, { status: 201 })
  } catch (error) {
    console.error('Ads POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
