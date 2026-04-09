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
import { JsonLd } from '@/components/seo/JsonLd'

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://virtualfreaks.co'
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
      images: [
        {
          url: `${appUrl}/api/og?title=${encodeURIComponent(name + (profile.title ? ' — ' + profile.title : ''))}&description=${encodeURIComponent(description)}`,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${appUrl}/api/og?title=${encodeURIComponent(name + (profile.title ? ' — ' + profile.title : ''))}&description=${encodeURIComponent(description)}`],
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
  const isOtherSeeker = user?.role === 'seeker' && !isOwner
  const hideRate = isOtherSeeker

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://virtualfreaks.co'
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
      <JsonLd data={personSchema} />

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

            {/* Social Links */}
            {(profile.linkedinUrl || profile.githubUrl || profile.twitterUrl || profile.facebookUrl || profile.instagramUrl || profile.portfolioUrl) && (
              <div className="mt-4 pt-4 border-t border-brand-border">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[#0077B5]/15 text-[#0077B5] hover:bg-[#0077B5]/30 border border-[#0077B5]/30 transition-all hover:scale-110">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" title="GitHub"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-brand-border/50 text-brand-muted hover:bg-brand-border hover:text-brand-text border border-brand-border transition-all hover:scale-110">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                  )}
                  {profile.twitterUrl && (
                    <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" title="Twitter / X"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-brand-border/50 text-brand-muted hover:bg-brand-border hover:text-brand-text border border-brand-border transition-all hover:scale-110">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {profile.facebookUrl && (
                    <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" title="Facebook"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1877F2]/15 text-[#1877F2] hover:bg-[#1877F2]/30 border border-[#1877F2]/30 transition-all hover:scale-110">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {profile.instagramUrl && (
                    <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E4405F]/15 text-[#E4405F] hover:bg-[#E4405F]/30 border border-[#E4405F]/30 transition-all hover:scale-110">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/></svg>
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" title="Portfolio / Website"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-brand-purple/15 text-brand-purple hover:bg-brand-purple/30 border border-brand-purple/30 transition-all hover:scale-110">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="font-bold gradient-text text-lg">
                  {hideRate ? '—' : profile.hourlyRate ? `$${profile.hourlyRate}` : 'TBD'}
                </div>
                <div className="text-brand-muted text-xs">{hideRate ? 'Rate hidden' : profile.rateType === 'monthly' ? 'per month' : 'per hour'}</div>
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
              <ShareProfileLink username={profile.username} profileName={profile.user.name || profile.username} compact />
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
                  {hideRate ? 'Hidden' : profile.hourlyRate ? `$${profile.hourlyRate}${profile.rateType === 'monthly' ? '/mo' : '/hr'}` : 'Negotiable'}
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
