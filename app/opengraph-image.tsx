import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Virtual Freaks — The Marketplace for Remote Talent'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Purple glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* VF Logo text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #a855f7, #ec4899, #f97316)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0.05em',
            }}
          >
            VIRTUAL FREAKS
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#a1a1aa',
            marginBottom: '48px',
            textAlign: 'center',
          }}
        >
          The Marketplace for Remote Talent
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
          }}
        >
          {[
            { label: 'Freelancers', icon: '👨‍💻' },
            { label: 'Categories', icon: '📂' },
            { label: 'Free for Employers', icon: '✨' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(139, 92, 246, 0.08)',
              }}
            >
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{ color: '#d4d4d8', fontSize: '18px' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '18px',
            color: '#71717a',
          }}
        >
          virtualfreaks.co
        </div>
      </div>
    ),
    { ...size }
  )
}
