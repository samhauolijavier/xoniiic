import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { RatingBar } from '@/components/ui/RatingBar'
import { PremiumBadge } from '@/components/ui/PremiumBadge'
import { FoundingMemberBadge } from '@/components/ui/FoundingMemberBadge'

interface ProfileCardProps {
  hideMonetization?: boolean
  profile: {
    id: string
    username: string
    avatarUrl: string | null
    bio: string | null
    location: string | null
    hourlyRate: number | null
    rateType?: string | null
    availability: string
    englishRating: number
    featured: boolean
    profileViews: number
    title?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    lastActiveAt?: string | Date | null
    user: {
      name: string | null
      premium?: boolean
      foundingMemberNumber?: number | null
    }
    skills: {
      id: string
      rating: number
      skill: {
        name: string
        slug: string
        category: string
      }
    }[]
  }
}

export function ProfileCard({ profile, hideMonetization }: ProfileCardProps) {
  const topSkills = profile.skills
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)

  const initials = profile.user.name
    ? profile.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile.username[0].toUpperCase()

  const isActiveNow = profile.lastActiveAt
    ? new Date().getTime() - new Date(profile.lastActiveAt).getTime() < 30 * 60 * 1000
    : false

  return (
    <Link href={`/talent/${profile.username}`}>
      <div className="card p-5 h-full flex flex-col group cursor-pointer hover-glow relative overflow-hidden">
        {profile.featured && (
          <div className="absolute top-0 right-0">
            <div className="bg-gradient-to-r from-brand-purple to-brand-orange text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              Featured
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            {profile.avatarUrl ? (
              <div className="w-14 h-14 rounded-full overflow-hidden avatar-ring">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.user.name || profile.username}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-lg">
                {initials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 ring-2 ring-brand-bg rounded-full">
              <Badge status={profile.availability} size="sm" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-brand-text truncate group-hover:gradient-text transition-all">
                {profile.user.name || profile.username}
              </h3>
              {profile.user.premium && !hideMonetization && <PremiumBadge size="sm" />}
              {profile.user.foundingMemberNumber && (
                <FoundingMemberBadge number={profile.user.foundingMemberNumber} size="sm" />
              )}
              {isActiveNow && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Active now" />
              )}
            </div>
            {profile.title ? (
              <p className="text-xs gradient-text font-medium truncate">{profile.title}</p>
            ) : (
              <p className="text-sm text-brand-muted">@{profile.username}</p>
            )}
            {profile.location && (
              <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-brand-muted line-clamp-2 mb-4 flex-1">
            {profile.bio}
          </p>
        )}

        {/* Top Skills */}
        {topSkills.length > 0 && (
          <div className="mb-4 space-y-2">
            {topSkills.map((s) => (
              <RatingBar
                key={s.id}
                rating={s.rating}
                label={s.skill.name}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-brand-border mt-auto">
          <div className="flex items-center gap-2">
            {profile.hourlyRate ? (
              <span className="text-sm font-semibold gradient-text-h">
                ${profile.hourlyRate}{profile.rateType === 'monthly' ? '/mo' : '/hr'}
              </span>
            ) : (
              <span className="text-sm text-brand-muted">Rate negotiable</span>
            )}
            {(profile.linkedinUrl || profile.githubUrl) && (
              <span className="flex items-center gap-1 ml-1">
                {profile.linkedinUrl && (
                  <span className="text-[#0077B5]" title="LinkedIn">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </span>
                )}
                {profile.githubUrl && (
                  <span className="text-brand-muted" title="GitHub">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-brand-muted">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {profile.profileViews}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-emerald-400">EN</span>
              {profile.englishRating}/10
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
