import { BadgeTooltip } from './BadgeTooltip'

export function PremiumBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 shadow-md">
        <span>★</span>
        <span>Premium</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950">
        <span>★</span>
        <span>Premium</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Premium Member"
      description="This seeker invests in their career and gets priority visibility to employers."
    >
      {badge}
    </BadgeTooltip>
  )
}
