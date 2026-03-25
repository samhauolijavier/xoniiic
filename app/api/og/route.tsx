import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'The Marketplace for Remote Talent'
  const description = searchParams.get('description') || 'Connect with skilled freelancers worldwide — completely free for employers.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 50%, #0a0a0f 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="vfgrad" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <path d="M15 25 L50 85 L85 25 M30 25 L50 65 L70 25" stroke="url(#vfgrad)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="20" y1="15" x2="80" y2="15" stroke="url(#vfgrad)" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            display: 'flex',
            fontSize: '56px',
            fontWeight: 900,
            letterSpacing: '0.06em',
            background: 'linear-gradient(90deg, #a855f7, #ec4899, #f97316)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '16px',
          }}
        >
          VIRTUAL FREAKS
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            color: '#e2e8f0',
            fontWeight: 600,
            marginBottom: '12px',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            display: 'flex',
            fontSize: '18px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, #a855f7, #ec4899, #f97316)',
          }}
        />

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            display: 'flex',
            fontSize: '16px',
            color: '#64748b',
            letterSpacing: '0.05em',
          }}
        >
          virtualfreaks.co
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
