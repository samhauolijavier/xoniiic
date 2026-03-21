import { BadgeTooltip } from './BadgeTooltip'

interface FoundingMemberBadgeProps {
  number: number
  size?: 'sm' | 'md'
}

export function FoundingMemberBadge({ number, size = 'sm' }: FoundingMemberBadgeProps) {
  const isInnerCircle = number <= 10

  const tooltipDesc = isInnerCircle
    ? 'One of the first 10 hand-picked members of Virtual Freaks. Inner circle OG.'
    : 'One of the first 250 members of Virtual Freaks. A true OG.'

  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-yellow-950 shadow-md shadow-amber-500/20">
        <span>{isInnerCircle ? '\u{1F451}' : '\u2726'}</span>
        <span>Founding Member #{number}</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-yellow-950">
        <span>{isInnerCircle ? '\u{1F451}' : '\u2726'}</span>
        <span>#{number}</span>
      </span>
    )

  return (
    <BadgeTooltip
      name={`Founding Member #${number}`}
      description={tooltipDesc}
    >
      {badge}
    </BadgeTooltip>
  )
}
