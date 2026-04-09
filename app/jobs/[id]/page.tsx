export const dynamic = 'force-dynamic'

import { db, withRetry } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ApplyButton } from './ApplyButton'
import { JsonLd } from '@/components/seo/JsonLd'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const job = await db.jobNeed.findUnique({
    where: { id: params.id },
    include: {
      employer: {
        select: {
          name: true,
          employerProfile: { select: { companyName: true } },
        },
      },
    },
  })

  if (!job || job.status !== 'active') return { title: 'Job Not Found' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://virtualfreaks.co'
  const canonicalUrl = `${appUrl}/jobs/${params.id}`
  const companyName = job.employer.employerProfile?.companyName || job.employer.name || 'Company'
  const title = `${job.title} at ${companyName} | Virtual Freaks`

  const ratePart = job.minRate && job.maxRate
    ? ` $${job.minRate}-$${job.maxRate}/hr.`
    : job.minRate
      ? ` From $${job.minRate}/hr.`
      : job.maxRate
        ? ` Up to $${job.maxRate}/hr.`
        : ''

  let description = job.description
    ? job.description.slice(0, 140)
    : `${job.title} — ${job.category} role at ${companyName}.${ratePart}`

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
      type: 'website',
      images: [
        {
          url: `${appUrl}/api/og?title=${encodeURIComponent(job.title + ' at ' + companyName)}&description=${encodeURIComponent(description)}`,
          width: 1200,
          height: 630,
          alt: job.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

async function getJob(id: string) {
  return withRetry(() =>
    db.jobNeed.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            employerProfile: {
              select: {
                companyName: true,
                logoUrl: true,
                website: true,
                description: true,
                verified: true,
                verificationTier: true,
                location: true,
                industry: true,
                companySize: true,
              },
            },
          },
        },
        _count: { select: { interests: true } },
      },
    })
  )
}

function formatRate(min: number | null, max: number | null) {
  if (min && max) return `$${min} - $${max}/hr`
  if (min) return `From $${min}/hr`
  if (max) return `Up to $${max}/hr`
  return null
}

function timeAgo(date: Date) {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const job = await getJob(params.id)

  if (!job || job.status !== 'active') {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const user = session?.user as { id: string; role: string } | undefined

  // Check if user already applied
  let hasApplied = false
  if (user) {
    try {
      const existing = await withRetry(() =>
        db.needInterest.findUnique({
          where: { needId_seekerId: { needId: job.id, seekerId: user.id } },
        })
      )
      hasApplied = !!existing
    } catch {
      // Non-critical
    }
  }

  const rate = formatRate(job.minRate, job.maxRate)
  const skillsList = job.skills
    ? job.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    : []
  const companyName =
    job.employer.employerProfile?.companyName || job.employer.name || 'Company'
  const profile = job.employer.employerProfile

  const jobPostingSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.createdAt.toISOString(),
    "employmentType": job.availability === 'full-time' ? 'FULL_TIME' : job.availability === 'part-time' ? 'PART_TIME' : 'CONTRACTOR',
    "jobLocationType": "TELECOMMUTE",
    "hiringOrganization": {
      "@type": "Organization",
      "name": companyName,
      ...(profile?.logoUrl ? { logo: profile.logoUrl } : {}),
      ...(profile?.website ? { sameAs: profile.website } : {}),
    },
    ...(job.minRate || job.maxRate
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
              "@type": "QuantitativeValue",
              ...(job.minRate ? { minValue: job.minRate } : {}),
              ...(job.maxRate ? { maxValue: job.maxRate } : {}),
              "unitText": "HOUR",
            },
          },
        }
      : {}),
    ...(skillsList.length > 0 ? { skills: skillsList.join(', ') } : {}),
    "industry": job.category,
    "url": `https://virtualfreaks.co/jobs/${job.id}`,
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <JsonLd data={jobPostingSchema} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-brand-muted hover:text-brand-text transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                {profile?.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={companyName}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-purple font-bold text-xl">
                      {companyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-brand-text">{job.title}</h1>
                  <p className="text-brand-muted mt-1">{companyName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                  {job.category}
                </span>
                {rate && (
                  <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    {rate}
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-brand-bg border border-brand-border text-brand-muted">
                  Posted {timeAgo(job.createdAt)}
                </span>
                <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-brand-bg border border-brand-border text-brand-muted">
                  {job._count.interests} applicant{job._count.interests !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4">Job Description</h2>
              <div className="text-brand-muted whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {skillsList.length > 0 && (
              <div className="bg-brand-card border border-brand-border rounded-xl p-6">
                <h2 className="text-lg font-bold text-brand-text mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-sm rounded-lg bg-brand-bg border border-brand-border text-brand-text"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Section */}
            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4">Interested in this role?</h2>
              {!user ? (
                <div>
                  <p className="text-brand-muted mb-4">
                    Sign in or create an account to apply for this job.
                  </p>
                  <Link href="/login" className="btn-primary inline-block px-6 py-2">
                    Sign In to Apply
                  </Link>
                </div>
              ) : user.role === 'employer' ? (
                <p className="text-brand-muted">
                  Employer accounts cannot apply to jobs. Switch to a seeker account to apply.
                </p>
              ) : hasApplied ? (
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">You&apos;ve already applied to this job</span>
                </div>
              ) : (
                <ApplyButton jobId={job.id} />
              )}
            </div>
          </div>

          {/* Sidebar - Employer Info */}
          <div className="space-y-6">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4">About the Employer</h2>

              <div className="flex items-center gap-3 mb-4">
                {profile?.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={companyName}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                    <span className="text-brand-purple font-bold text-lg">
                      {companyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-brand-text">{companyName}</h3>
                  {profile?.verified && (
                    <span className="text-xs text-green-400">Verified Employer</span>
                  )}
                </div>
              </div>

              {profile?.description && (
                <p className="text-sm text-brand-muted mb-4 line-clamp-4">
                  {profile.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                {profile?.industry && (
                  <div className="flex items-center gap-2 text-brand-muted">
                    <span className="font-medium text-brand-text">Industry:</span>
                    {profile.industry}
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-brand-muted">
                    <span className="font-medium text-brand-text">Location:</span>
                    {profile.location}
                  </div>
                )}
                {profile?.companySize && (
                  <div className="flex items-center gap-2 text-brand-muted">
                    <span className="font-medium text-brand-text">Size:</span>
                    {profile.companySize}
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center gap-2 text-brand-muted">
                    <span className="font-medium text-brand-text">Website:</span>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-purple hover:underline truncate"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              <Link
                href={`/employer-profile/${job.employer.id}`}
                className="mt-4 inline-block text-sm text-brand-purple hover:underline"
              >
                View Full Profile
              </Link>
            </div>

            {/* Job Details Summary */}
            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4">Job Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Category</span>
                  <span className="text-brand-text font-medium">{job.category}</span>
                </div>
                {rate && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Rate</span>
                    <span className="text-brand-text font-medium">{rate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-brand-muted">Availability</span>
                  <span className="text-brand-text font-medium capitalize">{job.availability}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Posted</span>
                  <span className="text-brand-text font-medium">{timeAgo(job.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Applications</span>
                  <span className="text-brand-text font-medium">{job._count.interests}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
