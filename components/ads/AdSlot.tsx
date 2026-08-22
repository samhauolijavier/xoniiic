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
import { adWhereClause, placementSpec, type Placement } from '@/lib/ads'

export async function AdSlot({ placement }: { placement: Placement }) {
  const spec = placementSpec(placement)

  let ads: { id: string; imageUrl: string; linkUrl: string; altText: string }[] = []
  try {
    ads = await withRetry(() => db.adSlot.findMany({
      where: adWhereClause(placement),
      orderBy: { createdAt: 'desc' },
      select: { id: true, imageUrl: true, linkUrl: true, altText: true },
    }))
  } catch (error) {
    // An ad is never worth breaking a page for.
    console.error('Ad load failed:', error)
    return null
  }

  if (!ads.length) return null

  // One slot, one ad. Rotating on the server would mean a different ad on every
  // render and no cache; picking by the minute gives every booked ad a turn
  // without making the page uncacheable.
  const ad = ads[Math.floor(Date.now() / 60000) % ads.length]

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.imageUrl}
          alt={ad.altText}
          width={spec.width}
          height={spec.height}
          loading="lazy"
          className="block w-full h-auto rounded-xl border border-brand-border bg-brand-card"
          style={{ aspectRatio: spec.ratio, objectFit: 'contain', maxWidth: spec.width }}
        />
      </a>
      {/* Said plainly. Somebody who works out for themselves that it was an ad
          trusts the rest of the page less than somebody who was told. */}
      <p className="text-[10px] uppercase tracking-wider text-brand-muted mt-1.5">Sponsored</p>
    </div>
  )
}
