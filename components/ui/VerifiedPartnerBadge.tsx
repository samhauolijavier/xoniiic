import { BadgeTooltip } from './BadgeTooltip'

export function VerifiedPartnerBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white shadow-md">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Verified Partner</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Partner</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Verified Partner"
      description="This employer subscribes to Virtual Freaks and has been verified as a real business."
    >
      {badge}
    </BadgeTooltip>
  )
}
