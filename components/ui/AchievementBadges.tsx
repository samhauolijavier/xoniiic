import { BadgeTooltip } from './BadgeTooltip'

// ─── Seeker Badges (Free) ────────────────────────────────────────────────────

export function ProfileProBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md">
        <span>🎯</span>
        <span>Profile Pro</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-400 text-white">
        <span>🎯</span>
        <span>Profile Pro</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Profile Pro"
      description="Completed 100% of their profile"
    >
      {badge}
    </BadgeTooltip>
  )
}

export function FirstStepsBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-slate-600 text-slate-100 shadow-md">
        <span>👋</span>
        <span>First Steps</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-600 text-slate-100">
        <span>👋</span>
        <span>First Steps</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="First Steps"
      description="Created their profile and joined the community"
    >
      {badge}
    </BadgeTooltip>
  )
}

export function ResponsiveBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-green-600 text-green-50 shadow-md">
        <span>⚡</span>
        <span>Responsive</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-green-50">
        <span>⚡</span>
        <span>Responsive</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Responsive"
      description="Responds to contact requests quickly"
    >
      {badge}
    </BadgeTooltip>
  )
}

export function MultilingualBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-indigo-600 text-indigo-50 shadow-md">
        <span>🌐</span>
        <span>Multilingual</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-indigo-50">
        <span>🌐</span>
        <span>Multilingual</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Multilingual"
      description="Speaks multiple languages"
    >
      {badge}
    </BadgeTooltip>
  )
}

// ─── Seeker Badges (Premium-only visual) ─────────────────────────────────────

export function RisingStarBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-300 text-amber-950 shadow-md shadow-amber-500/30">
        <span>🚀</span>
        <span>Rising Star</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-300 text-amber-950 shadow-sm shadow-amber-500/30">
        <span>🚀</span>
        <span>Rising Star</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Rising Star"
      description="Gaining traction with employers this week"
    >
      {badge}
    </BadgeTooltip>
  )
}

export function HotProfileBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-md">
        <span>🔥</span>
        <span>Hot Profile</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-orange-400 text-white">
        <span>🔥</span>
        <span>Hot Profile</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Hot Profile"
      description="One of the most viewed profiles on the platform"
    >
      {badge}
    </BadgeTooltip>
  )
}

// ─── Employer Badges ─────────────────────────────────────────────────────────

export function QuickResponderBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-cyan-600 text-cyan-50 shadow-md">
        <span>💬</span>
        <span>Quick Responder</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-600 text-cyan-50">
        <span>💬</span>
        <span>Quick Responder</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Quick Responder"
      description="Typically responds within 24 hours"
    >
      {badge}
    </BadgeTooltip>
  )
}

export function ActiveHirerBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const badge =
    size === 'md' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-violet-600 text-violet-50 shadow-md">
        <span>📋</span>
        <span>Active Hirer</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-600 text-violet-50">
        <span>📋</span>
        <span>Active Hirer</span>
      </span>
    )

  return (
    <BadgeTooltip
      name="Active Hirer"
      description="Actively contacting and hiring talent"
    >
      {badge}
    </BadgeTooltip>
  )
}

// ─── Utility Components ──────────────────────────────────────────────────────

interface SeekerBadgeData {
  profileCompletionScore: number
  contactRequestsAnswered: number
  languagesCount: number
  isPremium: boolean
  isTopViewed: boolean
  totalProfileViews: number
}

interface EmployerBadgeData {
  averageResponseHours: number
  totalContactsSent: number
}

export function ProfileBadges({
  seekerData,
  size = 'sm',
}: {
  seekerData: SeekerBadgeData
  size?: 'sm' | 'md'
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {/* First Steps — awarded to all seekers */}
      <FirstStepsBadge size={size} />

      {/* Profile Pro — profile completion = 100 */}
      {seekerData.profileCompletionScore >= 100 && (
        <ProfileProBadge size={size} />
      )}

      {/* Responsive — 3+ contact requests answered */}
      {seekerData.contactRequestsAnswered >= 3 && (
        <ResponsiveBadge size={size} />
      )}

      {/* Multilingual — 2+ languages */}
      {seekerData.languagesCount >= 2 && (
        <MultilingualBadge size={size} />
      )}

      {/* Rising Star — premium + top 20 most viewed */}
      {seekerData.isPremium && seekerData.isTopViewed && (
        <RisingStarBadge size={size} />
      )}

      {/* Hot Profile — premium + 50+ total views */}
      {seekerData.isPremium && seekerData.totalProfileViews >= 50 && (
        <HotProfileBadge size={size} />
      )}
    </span>
  )
}

export function EmployerBadges({
  employerData,
  size = 'sm',
}: {
  employerData: EmployerBadgeData
  size?: 'sm' | 'md'
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {/* Quick Responder — average response under 24 hours */}
      {employerData.averageResponseHours <= 24 && (
        <QuickResponderBadge size={size} />
      )}

      {/* Active Hirer — 10+ contacts sent */}
      {employerData.totalContactsSent >= 10 && (
        <ActiveHirerBadge size={size} />
      )}
    </span>
  )
}
