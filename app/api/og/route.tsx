import { ImageResponse } from 'next/og'
import { getLogoUrl } from '@/lib/brand'

// Node rather than edge, so the real mark can be read from site settings.
// These are the cards members post to Facebook and LinkedIn; a drawn stand-in
// where the logo should be is the difference between a share that looks like
// a company and one that looks like a side project.

/*
 * The card LinkedIn and Facebook draw when somebody reposts their profile.
 *
 * This is the whole reason a profile link is worth sharing, and it was still
 * the old site: near-black with purple glows, carrying nothing but two lines of
 * text. Somebody pasting their profile got a preview for a company that does
 * not look like this any more, with no photo and no evidence of who they are.
 *
 * Two shapes now. Given a name it renders a person — photo, name, headline,
 * skills — because a face in a feed is the difference between a scroll and a
 * click. Without one it falls back to a plain site card for the homepage and
 * everything else.
 */

const PAPER = '#fbf9f8'
const INK = '#1a1418'
const MUTED = '#837b80'
const ACCENT = '#a21caf'
const RULE = '#e6e0e2'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const logoUrl = await getLogoUrl()

  const name = searchParams.get('name')
  const headline = searchParams.get('headline') || ''
  const avatar = searchParams.get('avatar') || ''
  // Trimmed here rather than by the caller, so a trailing comma or a stray
  // space cannot produce an empty pill in the card.
  const skills = (searchParams.get('skills') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 4)
  const placed = searchParams.get('placed') === '1'

  const title = searchParams.get('title') || 'The Marketplace for Remote Talent'
  const description =
    searchParams.get('description') ||
    'Build a profile that shows real work. Free, and no commission, ever.'

  const wordmark = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoUrl}
          alt=""
          width={52}
          height={49}
          style={{ width: 52, height: 49, objectFit: 'contain', marginRight: 11 }}
        />
      ) : (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: ACCENT,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          VF
        </div>
      )}
      <div style={{ fontSize: 21, fontWeight: 700, color: INK, letterSpacing: '0.02em' }}>
        VIRTUAL FREAKS
      </div>
    </div>
  )

  if (name) {
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
            padding: '56px 64px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatar}
                alt=""
                width={132}
                height={132}
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 66,
                  objectFit: 'cover',
                  marginRight: 32,
                  border: `3px solid ${RULE}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 66,
                  background: ACCENT,
                  color: '#fff',
                  fontSize: 48,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 32,
                }}
              >
                {name.trim()[0]?.toUpperCase() ?? 'V'}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 700 }}>
              <div
                style={{
                  fontSize: 58,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                }}
              >
                {name.length > 34 ? `${name.slice(0, 34)}…` : name}
              </div>
              {headline ? (
                <div style={{ fontSize: 28, color: MUTED, marginTop: 12, lineHeight: 1.25 }}>
                  {headline.length > 90 ? `${headline.slice(0, 90)}…` : headline}
                </div>
              ) : null}
              {placed ? (
                <div
                  style={{
                    display: 'flex',
                    marginTop: 16,
                    fontSize: 20,
                    fontWeight: 600,
                    color: ACCENT,
                  }}
                >
                  Placed through Virtual Freaks
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {skills.length > 0 ? (
              <div style={{ display: 'flex', marginBottom: 28 }}>
                {skills.map(skill => (
                  <div
                    key={skill}
                    style={{
                      display: 'flex',
                      fontSize: 22,
                      color: INK,
                      background: '#fff',
                      border: `1px solid ${RULE}`,
                      borderRadius: 100,
                      padding: '10px 22px',
                      marginRight: 12,
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            ) : null}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: `1px solid ${RULE}`,
                paddingTop: 26,
              }}
            >
              {wordmark}
              <div style={{ fontSize: 20, color: MUTED }}>virtualfreaks.co</div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

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
          padding: '64px',
        }}
      >
        {wordmark}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
            }}
          >
            {title.length > 80 ? `${title.slice(0, 80)}…` : title}
          </div>
          <div style={{ fontSize: 28, color: MUTED, marginTop: 20, lineHeight: 1.35, maxWidth: 940 }}>
            {description.length > 150 ? `${description.slice(0, 150)}…` : description}
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
          <div style={{ fontSize: 22, color: ACCENT, fontWeight: 600 }}>No commission, ever</div>
          <div style={{ fontSize: 20, color: MUTED }}>virtualfreaks.co</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
