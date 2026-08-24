/*
 * Where an ad actually appears.
 *
 * Until now AdSlot rows were written by the admin screen and read by nobody —
 * toggling one Active flipped a column no page ever looked at. This is the
 * half that was missing.
 *
 * Renders nothing when there is nothing scheduled. No "advertise here"
 * placeholder, no empty bordered box: a slot that announces its own emptiness
 * tells every visitor the site could not sell it.
 */
import { db, withRetry } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adWhereClause, audiencesFor, placementSpec, type Placement } from '@/lib/ads'

export async function AdSlot({ placement }: { placement: Placement }) {
  const spec = placementSpec(placement)

  // Resolved here rather than passed in. Every page that wants a slot would
  // otherwise have to thread the viewer's role down to it, and the one that
  // forgot would quietly show freelancer ads to businesses.
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  const audiences = audiencesFor(role)

  // Nothing to match against means nothing to show. Returning before the query
  // also means a page open to the public does not hit the database for an ad it
  // was never going to render.
  if (!audiences.length) return null

  let ads: { id: string; imageUrl: string; linkUrl: string; altText: string; priority: number }[] = []
  try {
    ads = await withRetry(() => db.adSlot.findMany({
      where: adWhereClause(placement, audiences),
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, imageUrl: true, linkUrl: true, altText: true, priority: true },
    }))
  } catch (error) {
    // An ad is never worth breaking a page for.
    console.error('Ad load failed:', error)
    return null
  }

  if (!ads.length) return null

  // Priority decides the slot; rotation only settles ties.
  //
  // Everything below the top tier waits, which is what makes priority mean
  // something — an advertiser told they are top should not be sharing with
  // whoever was uploaded after them. Within a tier the minute picks, so equals
  // get equal share without making the page uncacheable.
  const topTier = ads.filter(a => a.priority === ads[0].priority)
  const ad = topTier[Math.floor(Date.now() / 60000) % topTier.length]

  // Count the impression. Nothing incremented viewCount before, so the Views
  // column an advertiser looks at first has always read zero.
  //
  // Not awaited: a counter is never worth holding a page render for, and a
  // failed count costs a number rather than a page.
  db.adSlot.update({
    where: { id: ad.id },
    data: {
      viewCount: { increment: 1 },
      ...(role === 'seeker' ? { viewsSeeker: { increment: 1 } } : {}),
      ...(role === 'employer' ? { viewsEmployer: { increment: 1 } } : {}),
    },
  }).catch(error => console.error('Ad view count failed:', error))

  return (
    <div className="my-6">
      <a
        href={`/api/ads/${ad.id}/click`}
        target="_blank"
        // Advertiser links are outside content. noopener stops the destination
        // reaching back into this tab; nofollow keeps paid links from passing
        // ranking, which is what search engines ask for and what keeps the site
        // out of trouble.
        rel="noopener noreferrer nofollow sponsored"
        className="block"
      >
        {/* The frame is full width so the block lines up with every other card
            on the page; the creative sits inside it at its own size rather than
            being stretched to fill. A 728px banner blown up to a 1100px column
            is somebody's paid artwork upscaled and soft, which is worse than a
            little space either side of it. */}
        <div
          className="w-full rounded-xl border border-brand-border bg-brand-card flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: spec.ratio }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.imageUrl}
            alt={ad.altText}
            width={spec.width}
            height={spec.height}
            loading="lazy"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </a>
      {/* Said plainly. Somebody who works out for themselves that it was an ad
          trusts the rest of the page less than somebody who was told. */}
      <p className="text-[10px] uppercase tracking-wider text-brand-muted mt-1.5">Sponsored</p>
    </div>
  )
}
