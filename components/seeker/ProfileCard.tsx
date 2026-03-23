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
          <div>
            {profile.hourlyRate ? (
              <span className="text-sm font-semibold gradient-text-h">
                ${profile.hourlyRate}{profile.rateType === 'monthly' ? '/mo' : '/hr'}
              </span>
            ) : (
              <span className="text-sm text-brand-muted">Rate negotiable</span>
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
