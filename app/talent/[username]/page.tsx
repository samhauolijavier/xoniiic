export const dynamic = "force-dynamic"
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { RatingBar } from '@/components/ui/RatingBar'
import { ContactModal } from '@/components/seeker/ContactModal'
import { SaveButton } from '@/components/seeker/SaveButton'
import { ShareProfileLink } from '@/components/seeker/ShareProfileLink'
import { ReviewList } from '@/components/reviews/ReviewList'
import { SeekerProfileClient } from './SeekerProfileClient'
import { PremiumBadge } from '@/components/ui/PremiumBadge'
import { FoundingMemberBadge } from '@/components/ui/FoundingMemberBadge'
import { createNotification } from '@/lib/notifications'

async function getProfile(username: string) {
  return db.seekerProfile.findUnique({
    where: { username },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true, premium: true, foundingMemberNumber: true } },
      skills: {
        include: { skill: true },
        orderBy: { rating: 'desc' },
      },
      portfolioLinks: { orderBy: { order: 'asc' } },
      certificates: { orderBy: { createdAt: 'asc' } },
      projectImages: { orderBy: { order: 'asc' } },
      languages: true,
      reviewsReceived: {
        include: {
          reviewerUser: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const profile = await db.seekerProfile.findUnique({
    where: { username: params.username },
    include: {
      user: { select: { name: true } },
      skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 1 },
    },
  })

  if (!profile) return { title: 'Not Found' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://virtualfreaks.com'
  const canonicalUrl = `${appUrl}/talent/${params.username}`
  const name = profile.user.name || profile.username
  const title = profile.title ? `${name} — ${profile.title} | Virtual Freaks` : `${name} | Virtual Freaks`
  const topSkill = profile.skills[0]?.skill.name

  let description = profile.bio
    ? profile.bio.slice(0, 160)
    : `${name} is${topSkill ? ` a ${topSkill}` : ''} on Virtual Freaks.${profile.hourlyRate ? ` $${profile.hourlyRate}${profile.rateType === 'monthly' ? '/mo' : '/hr'}.` : ''} Browse their full profile and portfolio.`

  if (description.length > 160) {
    description = description.slice(0, 157) + '...'
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'profile',
      images: profile.avatarUrl
        ? [{ url: profile.avatarUrl, width: 400, height: 400, alt: name }]
        : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  }
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function isVimeoUrl(url: string): boolean {
  return url.includes('vimeo.com')
}

const LEVEL_LABELS: Record<string, string> = {
  basic: 'Basic',
  conversational: 'Conversational',
  fluent: 'Fluent',
  native: 'Native',
}

export default async function TalentProfilePage({ params }: { params: { username: string } }) {
  const [profile, session] = await Promise.all([
    getProfile(params.username),
    getServerSession(authOptions),
  ])

  if (!profile) notFound()

  const user = session?.user as { id: string; role: string } | undefined
  const isOwner = user?.id === profile.userId
  const isEmployer = user?.role === 'employer'

  // Track profile view: record employer visits (not the seeker themselves, not admin)
  try {
    if (user && isEmployer && !isOwner) {
      await db.profileView.create({
        data: { seekerProfileId: profile.id, viewerUserId: user.id },
      })

      // Throttle profile view notifications: max 1 per viewer per day
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentNotif = await db.notification.findFirst({
        where: {
          userId: profile.userId,
          type: 'profile_view',
          relatedId: user.id,
          createdAt: { gte: oneDayAgo },
        },
      })
      if (!recentNotif) {
        await createNotification({
          userId: profile.userId,
          type: 'profile_view',
          title: 'Someone Viewed Your Profile',
          message: 'An employer viewed your profile',
          actionUrl: '/dashboard',
          relatedId: user.id,
        })
      }
    }
    // Always increment the counter for any visitor (matches previous behaviour)
    await db.seekerProfile.update({
      where: { id: profile.id },
      data: { profileViews: { increment: 1 } },
    })
  } catch {
    // Never let view tracking break the page
  }

  const canContact = user && !isOwner
  const isLoggedIn = !!session

  const reviews = profile.reviewsReceived
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0

  // Serialize dates for client
  const reviewsForClient = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  const skillsByCategory = profile.skills.reduce<Record<string, typeof profile.skills>>((acc, s) => {
    const cat = s.skill.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const initials = profile.user.name
    ? profile.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile.username[0].toUpperCase()

  const joinDate = new Date(profile.user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const youtubeId = profile.videoIntroUrl ? getYouTubeId(profile.videoIntroUrl) : null
  const isVimeo = profile.videoIntroUrl ? isVimeoUrl(profile.videoIntroUrl) : false

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://virtualfreaks.com'
  const profileUrl = `${appUrl}/talent/${profile.username}`
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.user.name || profile.username,
    url: profileUrl,
    ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.title ? { jobTitle: profile.title } : {}),
    ...(profile.location ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } } : {}),
    ...(profile.skills.length > 0
      ? { knowsAbout: profile.skills.map(s => s.skill.name) }
      : {}),
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {!isLoggedIn && (
        <div className="mb-6 p-4 rounded-xl bg-brand-purple/10 border border-brand-purple/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-brand-text font-medium">
            Sign up free to view full profiles, contact freelancers, and save talent.
          </p>
          <a href="/register?role=employer" className="btn-primary text-sm whitespace-nowrap">
            Create Free Account
          </a>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile Card */}
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              {profile.avatarUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden avatar-ring mx-auto">
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.user.name || profile.username}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-black text-2xl mx-auto">
                  {initials}
                </div>
              )}
              {profile.featured && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-brand-purple to-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  ★
                </div>
              )}
            </div>

            <h1 className="text-xl font-bold text-brand-text">{profile.user.name || profile.username}</h1>
            {(profile.user.premium || profile.user.foundingMemberNumber) && (
              <div className="mt-1 flex justify-center gap-1.5 flex-wrap">
                {profile.user.premium && <PremiumBadge size="md" />}
                {profile.user.foundingMemberNumber && (
                  <FoundingMemberBadge number={profile.user.foundingMemberNumber} size="md" />
                )}
              </div>
            )}
            {profile.title && (
              <p className="text-sm gradient-text font-medium mt-0.5">{profile.title}</p>
            )}
            <p className="text-brand-muted text-sm mt-0.5">@{profile.username}</p>

            {!profile.openToWork && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-brand-border/60 text-brand-muted border border-brand-border">
                  ⏸️ Not currently looking for work
                </span>
              </div>
            )}

            <div className="mt-3 flex flex-col items-center gap-2">
              <Badge status={profile.availability} />
              {profile.lastActiveAt && (
                (() => {
                  const minsAgo = Math.floor((Date.now() - new Date(profile.lastActiveAt).getTime()) / 60000)
                  if (minsAgo < 30) {
                    return (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active Now
                      </span>
                    )
                  }
                  if (minsAgo < 1440) {
                    return (
                      <span className="flex items-center gap-1.5 text-xs text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        {minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`}
                      </span>
                    )
                  }
                  return null
                })()
              )}
            </div>

            {profile.location && (
              <p className="text-sm text-brand-muted mt-2 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.location}
              </p>
            )}

            {profile.timezone && (
              <p className="text-xs text-brand-muted mt-1 flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {profile.timezone}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="font-bold gradient-text text-lg">
                  {profile.hourlyRate ? `$${profile.hourlyRate}` : 'TBD'}
                </div>
                <div className="text-brand-muted text-xs">{profile.rateType === 'monthly' ? 'per month' : 'per hour'}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-brand-text text-lg">{profile.englishRating}/10</div>
                <div className="text-brand-muted text-xs">English</div>
              </div>
            </div>

            <div className="mt-3 text-xs text-brand-muted">
              Joined {joinDate} • {profile.profileViews} views
            </div>

            {/* Actions */}
            {canContact && (
              <div className="mt-5 space-y-2">
                <ContactModal profileId={profile.id} profileName={profile.user.name || profile.username} />
                <SaveButton profileId={profile.id} />
              </div>
            )}

            {isOwner && (
              <div className="mt-5">
                <a href="/profile/edit" className="btn-secondary w-full justify-center text-sm">
                  Edit Profile
                </a>
              </div>
            )}

            {!session && (
              <div className="mt-5 space-y-2">
                <a href="/register?role=employer" className="btn-primary w-full justify-center text-sm">
                  Contact This Freelancer
                </a>
                <p className="text-xs text-brand-muted">Free to contact — no subscription needed</p>
              </div>
            )}

            {/* Share button */}
            <div className="mt-4 pt-4 border-t border-brand-border">
              <ShareProfileLink username={profile.username} compact />
            </div>
          </div>

          {/* Sidebar: Report button for logged-in non-owners */}
          {isLoggedIn && !isOwner && (
            <SeekerProfileClient
              seekerProfileId={profile.id}
              seekerName={profile.user.name || profile.username}
              isEmployer={isEmployer}
              sessionUserId={user?.id}
              sidebarOnly
            />
          )}

          {/* English level */}
          <div className="card p-5">
            <h3 className="font-semibold text-brand-text mb-3">English Proficiency</h3>
            <RatingBar rating={profile.englishRating} label="English Level" />
            <p className="text-xs text-brand-muted mt-2">
              {profile.englishRating >= 9 ? 'Native/Fluent' :
               profile.englishRating >= 7 ? 'Professional' :
               profile.englishRating >= 5 ? 'Conversational' : 'Basic'}
            </p>
          </div>

          {/* Languages card */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-brand-text mb-3">Languages</h3>
              <div className="space-y-2">
                {profile.languages.map((lang) => (
                  <div key={lang.id} className="flex items-center justify-between">
                    <span className="text-sm text-brand-text">{lang.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-border text-brand-muted">
                      {LEVEL_LABELS[lang.level] || lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Intro card */}
          {profile.videoIntroUrl && (
            <div className="card p-5">
              <h3 className="font-semibold text-brand-text mb-3">Video Introduction</h3>
              {youtubeId ? (
                <a
                  href={profile.videoIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-black mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                      alt="Video intro thumbnail"
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <span className="btn-secondary text-sm w-full justify-center flex">
                    ▶ Watch Intro on YouTube
                  </span>
                </a>
              ) : isVimeo ? (
                <a
                  href={profile.videoIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm w-full justify-center flex"
                >
                  ▶ Watch Intro on Vimeo
                </a>
              ) : (
                <a
                  href={profile.videoIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm w-full justify-center flex"
                >
                  ▶ Watch Video Introduction
                </a>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className={`lg:col-span-2 space-y-6 ${!isLoggedIn ? 'relative' : ''}`}>
          {/* Bio */}
          {profile.bio && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-3">About</h2>
              <p className="text-brand-muted leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Skills by Category */}
          {Object.keys(skillsByCategory).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-5">Skills</h2>
              <div className="space-y-6">
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-brand-text">{category}</h3>
                      <div className="flex-1 h-px bg-brand-border" />
                    </div>
                    <div className="space-y-3">
                      {skills.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 sm:gap-4">
                          <div className="w-24 sm:w-32 text-sm text-brand-text flex-shrink-0 truncate">{s.skill.name}</div>
                          <div className="flex-1 min-w-0">
                            <RatingBar rating={s.rating} showLabel={false} size="sm" />
                          </div>
                          <div className="text-xs text-brand-muted w-8 text-right flex-shrink-0">{s.rating}/10</div>
                          {s.yearsExp && (
                            <div className="text-xs text-brand-muted w-12 sm:w-16 text-right flex-shrink-0">
                              {s.yearsExp}yr{s.yearsExp !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Links */}
          {profile.portfolioLinks && profile.portfolioLinks.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4">Portfolio & Links</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.portfolioLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-brand-border/40 hover:bg-brand-border/70 border border-brand-border rounded-xl px-4 py-3 transition-all group"
                  >
                    <svg className="w-4 h-4 text-brand-muted group-hover:text-brand-orange transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-sm font-medium text-brand-text truncate">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Project Gallery */}
          {profile.projectImages && profile.projectImages.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4">Project Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profile.projectImages.map((project) => (
                  <div key={project.id} className="group relative">
                    <div className="aspect-video rounded-xl overflow-hidden border border-brand-border bg-brand-border/30">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-brand-text truncate">{project.title}</p>
                      {project.description && (
                        <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {profile.certificates && profile.certificates.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4">Certifications</h2>
              <div className="space-y-3">
                {profile.certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-4 bg-brand-border/30 rounded-xl p-4 border border-brand-border">
                    {cert.imageUrl && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-brand-border flex-shrink-0">
                        <img src={cert.imageUrl} alt={cert.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {!cert.imageUrl && (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-purple/30 to-brand-orange/30 border border-brand-border flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-brand-text text-sm">{cert.name}</p>
                      <p className="text-xs text-brand-muted">
                        {cert.issuer}{cert.year ? ` • ${cert.year}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability Details */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-brand-text mb-4">Work Preferences</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-border/50 rounded-xl p-4">
                <div className="text-xs text-brand-muted mb-1">Availability</div>
                <Badge status={profile.availability} />
              </div>
              <div className="bg-brand-border/50 rounded-xl p-4">
                <div className="text-xs text-brand-muted mb-1">Rate</div>
                <div className="font-semibold gradient-text">
                  {profile.hourlyRate ? `$${profile.hourlyRate}${profile.rateType === 'monthly' ? '/mo' : '/hr'}` : 'Negotiable'}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-text">Reviews</h2>
            <ReviewList
              reviews={reviewsForClient}
              averageRating={averageRating}
              totalCount={totalReviews}
            />
          </div>

          {/* Client-side: Leave review + Report */}
          <SeekerProfileClient
            seekerProfileId={profile.id}
            seekerName={profile.user.name || profile.username}
            isEmployer={isEmployer}
            sessionUserId={user?.id}
          />

          {/* Gate overlay for non-logged-in users */}
          {!isLoggedIn && (
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-brand-bg via-brand-bg/95 to-transparent flex flex-col items-center justify-end pb-8 px-4">
              <div className="card p-6 text-center max-w-md w-full border-brand-purple/40 bg-brand-card/90 backdrop-blur-sm">
                <h3 className="font-bold text-brand-text text-lg mb-1">Sign up to view full profile</h3>
                <p className="text-sm text-brand-muted mb-4">
                  Create a free employer account to view complete profiles, skills, portfolio, and contact this freelancer.
                </p>
                <a href="/register?role=employer" className="btn-primary w-full justify-center">
                  Create Free Account
                </a>
                <a href="/login" className="block text-sm text-brand-muted hover:text-brand-text mt-3 transition-colors">
                  Already have an account? Sign in
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
