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

/**
 * Sends somebody on, or home if the destination is unusable.
 *
 * Only http and https. The destination comes from an advertiser, and without
 * this a javascript: or data: URL typed into the admin form would be handed to
 * a visitor's browser by our own domain.
 */
function redirectTo(linkUrl: string, fallback: string) {
  let destination: URL
  try {
    destination = new URL(linkUrl)
  } catch {
    return NextResponse.redirect(fallback)
  }
  if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
    return NextResponse.redirect(fallback)
  }
  return NextResponse.redirect(destination.toString())
}

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
    const viewer = session?.user as { id?: string; role?: string } | undefined
    const role = viewer?.role

    // Who clicked, kept for Spencer.
    //
    // Somebody clicking a GoHighLevel or Wavv offer has said something useful
    // about themselves, and following that up is ordinary business between a
    // platform and its own members. It never leaves this system — the
    // advertiser gets counts, not people.
    if (viewer?.id) {
      db.adClick.create({
        data: { adId: params.id, userId: viewer.id },
      }).catch(error => console.error('Ad click log failed:', error))
    }

    // Only a signed-in click counts.
    //
    // Adverts render exclusively to members, so a click arriving with no
    // session is a crawler, a preview bot, or somebody following a stale link
    // — Providence walked this very endpoint during an audit and would have
    // added one. An advertiser is buying a number that means people; a number
    // inflated by robots is worse than no number, because it is believed.
    //
    // The redirect still happens either way. Whoever it is still gets where
    // they were going; they are simply not counted as an audience.
    if (!viewer?.id) {
      return redirectTo(ad.linkUrl, fallback)
    }

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

    return redirectTo(ad.linkUrl, fallback)
  } catch (error) {
    console.error('Ad click error:', error)
    return NextResponse.redirect(fallback)
  }
}
