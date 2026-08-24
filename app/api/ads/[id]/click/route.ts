import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/*
 * Counts the click, then sends them on.
 *
 * Going through here rather than linking straight out is what makes the Clicks
 * column on the admin screen mean anything — and that number is what an
 * advertiser is actually buying.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fallback = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'

  try {
    const ad = await db.adSlot.findUnique({
      where: { id: params.id },
      select: { linkUrl: true },
    })
    if (!ad) return NextResponse.redirect(fallback)

    // Which side of the marketplace clicked, as a count — never who.
    //
    // An advertiser is buying the shape of an audience: how many saw it, how
    // many acted, and which side they were on. None of that needs a name, and
    // keeping a record of which member clicked which advert would build a log
    // of what everybody here is interested in — a thing nobody is paying for
    // and a liability to hold.
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role

    // Counted without waiting: a slow write should never sit between somebody
    // clicking and the page they wanted.
    db.adSlot.update({
      where: { id: params.id },
      data: {
        clickCount: { increment: 1 },
        ...(role === 'seeker' ? { clicksSeeker: { increment: 1 } } : {}),
        ...(role === 'employer' ? { clicksEmployer: { increment: 1 } } : {}),
      },
    }).catch(error => console.error('Ad click count failed:', error))

    // Only http and https. The destination is supplied by an advertiser, and
    // without this check a javascript: or data: URL entered in the admin form
    // would be handed to a visitor's browser from our own domain.
    let destination: URL
    try {
      destination = new URL(ad.linkUrl)
    } catch {
      return NextResponse.redirect(fallback)
    }
    if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
      return NextResponse.redirect(fallback)
    }

    return NextResponse.redirect(destination.toString())
  } catch (error) {
    console.error('Ad click error:', error)
    return NextResponse.redirect(fallback)
  }
}
