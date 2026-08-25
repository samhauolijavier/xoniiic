/*
 * The card that appears when somebody pastes virtualfreaks.co anywhere.
 *
 * This file quietly outranks everything else: Next's opengraph-image convention
 * takes precedence over metadata.images, so the carefully built /api/og route
 * was never reached for the homepage. What shipped instead was the old dark
 * site — near-black, gradient wordmark, three emoji buttons — which stopped
 * being what the site looked like some time ago.
 *
 * It matters more than its size suggests. The whole launch plan is people
 * sharing this link, and this image is the first thing every one of those
 * people sees. A preview that does not match the site reads as a dead project.
 *
 * The headline is the site's own, not the meta title. "The Marketplace for
 * Remote Talent" describes a category; "Nobody hires you without experience"
 * describes the problem somebody is scrolling with.
 */
import { ImageResponse } from 'next/og'
import { getLogoUrl } from '@/lib/brand'

// Node rather than edge: the mark is a site setting in the database, and the
// card should carry the real logo rather than a drawn stand-in.
export const alt = 'Virtual Freaks — build a profile that shows real work'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#fbf9f8'
const INK = '#1a1418'
const MUTED = '#6f676c'
const ACCENT = '#a21caf'
const RULE = '#e6e0e2'

export default async function Image() {
  const logoUrl = await getLogoUrl()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: PAPER,
          fontFamily: 'system-ui, sans-serif',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt=""
              width={72}
              height={68}
              style={{ width: 72, height: 68, objectFit: 'contain', marginRight: 14 }}
            />
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: ACCENT,
                color: '#fff',
                fontSize: 17,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              VF
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 700, color: INK, letterSpacing: '0.02em' }}>
            VIRTUAL FREAKS
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              maxWidth: 1000,
              display: 'flex',
            }}
          >
            Nobody hires you without experience.
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: ACCENT,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              display: 'flex',
              marginTop: 4,
            }}
          >
            Start here.
          </div>
          <div
            style={{
              fontSize: 27,
              color: MUTED,
              marginTop: 22,
              lineHeight: 1.35,
              maxWidth: 920,
              display: 'flex',
            }}
          >
            A free profile that shows real work, and people hiring who can contact you directly.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${RULE}`,
            paddingTop: 26,
          }}
        >
          <div style={{ fontSize: 22, color: ACCENT, fontWeight: 600, display: 'flex' }}>
            No commission, ever
          </div>
          <div style={{ fontSize: 20, color: MUTED, display: 'flex' }}>virtualfreaks.co</div>
        </div>
      </div>
    ),
    size
  )
}
