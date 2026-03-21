import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { VerifiedBadge, NewEmployerBadge } from '@/components/ui/VerifiedBadge'
import { VerifiedPartnerBadge } from '@/components/ui/VerifiedPartnerBadge'
import { VFVerifiedBadge } from '@/components/ui/VFVerifiedBadge'
import { ReviewList } from '@/components/reviews/ReviewList'
import { EmployerProfileClient } from './EmployerProfileClient'

async function getEmployerData(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      employerProfile: {
        include: {
          reviewsReceived: {
            include: {
              reviewerUser: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })
  return user
}

export default async function EmployerPublicProfilePage({ params }: { params: { id: string } }) {
  const [userData, session] = await Promise.all([
    getEmployerData(params.id),
    getServerSession(authOptions),
  ])

  if (!userData || !userData.employerProfile) notFound()

  const { employerProfile } = userData
  const reviews = employerProfile.reviewsReceived
  const totalCount = reviews.length
  const averageRating = totalCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
    : 0

  const isNewEmployer =
    !employerProfile.verified &&
    Date.now() - new Date(employerProfile.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000

  const sessionUser = session?.user as { id: string; role: string } | undefined
  const isSeeker = sessionUser?.role === 'seeker'

  // Serialize dates for client components
  const reviewsForClient = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/browse" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <div className="card p-6 text-center">
            {/* Avatar / Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-black text-2xl mx-auto mb-4">
              {(employerProfile.companyName || userData.name || 'E')[0].toUpperCase()}
            </div>

            <h1 className="text-xl font-bold text-brand-text">
              {employerProfile.companyName || userData.name || 'Employer'}
            </h1>

            <div className="mt-3 flex flex-col items-center gap-2">
              {employerProfile.verificationTier === 'vf_verified' ? (
                <VFVerifiedBadge size="md" />
              ) : userData.premium ? (
                <VerifiedPartnerBadge size="md" />
              ) : employerProfile.verified ? (
                <VerifiedBadge size="md" />
              ) : isNewEmployer ? (
                <NewEmployerBadge />
              ) : null}
            </div>

            {totalCount > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1 text-sm text-brand-muted">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#f97316' }}>
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="font-semibold text-brand-text">{averageRating.toFixed(1)}</span>
                <span>({totalCount} review{totalCount !== 1 ? 's' : ''})</span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-brand-border space-y-2">
              {employerProfile.website && (
                <a
                  href={employerProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-orange transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Website
                </a>
              )}
              {employerProfile.linkedIn && (
                <a
                  href={employerProfile.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-orange transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>

            <div className="mt-3 text-xs text-brand-muted">
              Member since {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {employerProfile.description && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-3">About</h2>
              <p className="text-brand-muted leading-relaxed">{employerProfile.description}</p>

              {/* Partner-only details */}
              {(employerProfile.industry || employerProfile.companySize || employerProfile.location || employerProfile.foundedYear) && (
                <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-2 gap-3">
                  {employerProfile.industry && (
                    <div>
                      <p className="text-xs text-brand-muted">Industry</p>
                      <p className="text-sm text-brand-text font-medium">{employerProfile.industry}</p>
                    </div>
                  )}
                  {employerProfile.companySize && (
                    <div>
                      <p className="text-xs text-brand-muted">Company Size</p>
                      <p className="text-sm text-brand-text font-medium">{employerProfile.companySize}</p>
                    </div>
                  )}
                  {employerProfile.location && (
                    <div>
                      <p className="text-xs text-brand-muted">Location</p>
                      <p className="text-sm text-brand-text font-medium">{employerProfile.location}</p>
                    </div>
                  )}
                  {employerProfile.foundedYear && (
                    <div>
                      <p className="text-xs text-brand-muted">Founded</p>
                      <p className="text-sm text-brand-text font-medium">{employerProfile.foundedYear}</p>
                    </div>
                  )}
                </div>
              )}

              {employerProfile.techStack && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <p className="text-xs text-brand-muted mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {employerProfile.techStack.split(',').map((t: string) => (
                      <span key={t.trim()} className="px-2 py-0.5 text-xs rounded-full bg-brand-purple/10 text-purple-300 border border-brand-purple/20">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Benefits & Culture */}
          {(employerProfile.benefits || employerProfile.cultureStatement) && (
            <div className="card p-6">
              {employerProfile.cultureStatement && (
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-brand-text mb-2">Culture</h2>
                  <p className="text-brand-muted leading-relaxed">{employerProfile.cultureStatement}</p>
                </div>
              )}
              {employerProfile.benefits && (
                <div>
                  <h2 className="text-lg font-bold text-brand-text mb-2">Benefits & Perks</h2>
                  <p className="text-brand-muted leading-relaxed">{employerProfile.benefits}</p>
                </div>
              )}
            </div>
          )}

          {/* Video Intro */}
          {employerProfile.videoIntroUrl && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-3">Company Video</h2>
              <a
                href={employerProfile.videoIntroUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-purple hover:underline"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch intro video
              </a>
            </div>
          )}

          {/* Reviews Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-text">Reviews</h2>
            <ReviewList
              reviews={reviewsForClient}
              averageRating={averageRating}
              totalCount={totalCount}
            />
          </div>

          {/* Client-side actions (leave review + report) */}
          <EmployerProfileClient
            employerProfileId={employerProfile.id}
            employerName={employerProfile.companyName || userData.name || 'Employer'}
            employerUserId={userData.id}
            isSeeker={isSeeker}
            sessionUserId={sessionUser?.id}
          />
        </div>
      </div>
    </div>
  )
}
