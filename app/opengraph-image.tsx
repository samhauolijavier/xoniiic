/*
 * The card that appears when somebody pastes virtualfreaks.co anywhere.
 *
 * It matters more than its size suggests: the whole plan is people sharing this
 * link, and this image is the first thing every one of them sees.
 *
 * It has been wrong twice now. First it was the old dark site with emoji
 * buttons, months after that design was retired. Then it was rebuilt on paper —
 * correct at the time — and stayed there when the site went ink and grew the
 * strikeout, so the preview stopped looking like the page it links to. Copy
 * changes are easy to remember; a design change one file away is not.
 *
 * So it now carries the three things that make the site recognisable: the ink
 * ground, Archivo at 900, and the rule through the phrase being rejected.
 */
import { ImageResponse } from 'next/og'
import { getLogoUrl } from '@/lib/brand'

export const alt = 'Virtual Freaks — nobody should have to pay to get hired'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#0f0d11'
const RULE = 'rgba(255,255,255,0.13)'
const DIM = 'rgba(255,255,255,0.58)'
const QUIET = 'rgba(255,255,255,0.45)'

/**
 * Satori needs real font data — it cannot resolve a family name the way a
 * browser can. Fetched at render; if it fails the card still draws in the
 * fallback face, because a plain-looking preview is a far smaller loss than no
 * preview at all.
 */
async function archivo(weight: 400 | 900): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Archivo:wght@${weight}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    ).then(r => r.text())
    const url = css.match(/src: url\((https:\/\/[^)]+)\)/)?.[1]
    if (!url) return null
    return await fetch(url).then(r => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Image() {
  const [logoUrl, bold, regular] = await Promise.all([
    getLogoUrl(),
    archivo(900),
    archivo(400),
  ])

  const fonts = [
    ...(bold ? [{ name: 'Archivo', data: bold, weight: 900 as const, style: 'normal' as const }] : []),
    ...(regular ? [{ name: 'Archivo', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
  ]
  const family = fonts.length ? 'Archivo' : 'system-ui, sans-serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          fontFamily: family,
          padding: 62,
          position: 'relative',
        }}
      >
        {/* One bloom, off to the side — the same shape the hero uses. */}
        <div
          style={{
            position: 'absolute',
            right: -220,
            top: -240,
            width: 760,
            height: 760,
            borderRadius: 380,
            background:
              'radial-gradient(circle, rgba(162,28,175,0.42), rgba(249,115,22,0.13) 52%, transparent 72%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt=""
              width={92}
              height={87}
              style={{ width: 92, height: 87, objectFit: 'contain', marginRight: 8 }}
            />
          ) : null}
          <div style={{ fontSize: 23, fontWeight: 900, color: '#fff', letterSpacing: '0.12em' }}>
            VIRTUAL FREAKS
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.042em',
              lineHeight: 1.02,
              display: 'flex',
            }}
          >
            Nobody should have to
          </div>

          {/* Satori has no pseudo-elements, so the rule is a real element laid
              over the phrase rather than a text-decoration. */}
          {/* Shrink to the phrase. A flex row stretches to its parent by
              default, which sent the rule out to the edge of the card instead
              of stopping where the words do. */}
          <div style={{ display: 'flex', position: 'relative', marginTop: 2, alignSelf: 'flex-start' }}>
            <div
              style={{
                fontSize: 74,
                fontWeight: 900,
                color: DIM,
                letterSpacing: '-0.042em',
                lineHeight: 1.02,
                display: 'flex',
              }}
            >
              pay to get hired.
            </div>
            <div
              style={{
                position: 'absolute',
                left: -4,
                right: -4,
                top: 40,
                height: 5,
                borderRadius: 4,
                background: 'linear-gradient(to right, #a21caf, #e879f9 50%, #f97316)',
              }}
            />
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: DIM,
              marginTop: 26,
              lineHeight: 1.35,
              maxWidth: 900,
              display: 'flex',
            }}
          >
            No fee to apply. No charge to message anyone. And no commission on what you earn.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${RULE}`,
            paddingTop: 24,
          }}
        >
          <div style={{ fontSize: 21, color: '#e879f9', fontWeight: 900, display: 'flex' }}>
            Free for freelancers and businesses
          </div>
          <div style={{ fontSize: 20, color: QUIET, display: 'flex' }}>virtualfreaks.co</div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) }
  )
}
