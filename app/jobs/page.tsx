import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Remote Job Board',
  description: 'Browse remote job opportunities from employers worldwide. Find freelance and full-time remote positions in development, design, marketing, and more.',
  alternates: {
    canonical: 'https://virtualfreaks.co/jobs',
  },
}

import { db, withRetry } from '@/lib/db'
import { excludeDemoAccounts } from '@/lib/constants'
import Link from 'next/link'

const CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Virtual Assistant',
  'Writing',
  'Customer Support',
  'Data Entry',
  'Other',
]

interface SearchParams {
  search?: string
  category?: string
  minRate?: string
  maxRate?: string
  page?: string
}

async function getJobs(params: SearchParams) {
  const page = parseInt(params.page || '1')
  const limit = 12
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: 'active',
    employer: { ...excludeDemoAccounts() },
  }

  if (params.category) {
    where.category = params.category
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { skills: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  if (params.minRate) {
    where.minRate = { gte: parseFloat(params.minRate) }
  }

  if (params.maxRate) {
    where.maxRate = { lte: parseFloat(params.maxRate) }
  }

  const [jobs, total] = await Promise.all([
    db.jobNeed.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            employerProfile: {
              select: { companyName: true, logoUrl: true, verified: true, verificationTier: true },
            },
          },
        },
        _count: { select: { interests: true } },
      },
    }),
    db.jobNeed.count({ where }),
  ])

  return { jobs, total, page, totalPages: Math.ceil(total / limit) }
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

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  let jobs: Awaited<ReturnType<typeof getJobs>>['jobs'] = []
  let total = 0
  let page = 1
  let totalPages = 1
  let dbError = false

  try {
    const result = await withRetry(() => getJobs(searchParams))
    jobs = result.jobs
    total = result.total
    page = result.page
    totalPages = result.totalPages
  } catch (error) {
    console.error('Job board DB query failed:', error)
    dbError = true
  }

  const activeFilters = [
    searchParams.search && `"${searchParams.search}"`,
    searchParams.category,
    searchParams.minRate && `Min $${searchParams.minRate}/hr`,
    searchParams.maxRate && `Max $${searchParams.maxRate}/hr`,
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
            Job <span className="gradient-text">Board</span>
          </h1>
          <p className="text-brand-muted mt-1">
            {total} open position{total !== 1 ? 's' : ''} available
            {searchParams.category && ` in ${searchParams.category}`}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-6 mb-8">
          <form method="GET" action="/jobs" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-brand-muted mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  placeholder="Search jobs..."
                  defaultValue={searchParams.search || ''}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-brand-muted mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue={searchParams.category || ''}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-purple transition-colors"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Rate */}
              <div>
                <label htmlFor="minRate" className="block text-sm font-medium text-brand-muted mb-1">
                  Min Rate ($/hr)
                </label>
                <input
                  type="number"
                  id="minRate"
                  name="minRate"
                  placeholder="0"
                  min="0"
                  defaultValue={searchParams.minRate || ''}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors"
                />
              </div>

              {/* Max Rate */}
              <div>
                <label htmlFor="maxRate" className="block text-sm font-medium text-brand-muted mb-1">
                  Max Rate ($/hr)
                </label>
                <input
                  type="number"
                  id="maxRate"
                  name="maxRate"
                  placeholder="Any"
                  min="0"
                  defaultValue={searchParams.maxRate || ''}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="btn-primary px-6 py-2 text-sm font-semibold"
              >
                Search Jobs
              </button>
              {activeFilters.length > 0 && (
                <Link
                  href="/jobs"
                  className="text-sm text-brand-muted hover:text-brand-text transition-colors"
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </form>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-border">
              <span className="text-xs text-brand-muted">Active filters:</span>
              {activeFilters.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {dbError ? (
          <div className="bg-brand-card border border-brand-border rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">&#9889;</div>
            <h3 className="text-xl font-semibold text-brand-text mb-2">Temporarily unavailable</h3>
            <p className="text-brand-muted mb-6">
              We&apos;re having trouble loading jobs right now. Please try again in a moment.
            </p>
            <Link href="/jobs" className="btn-primary">
              Try Again
            </Link>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-brand-card border border-brand-border rounded-xl p-16 text-center">
            {activeFilters.length > 0 ? (
              <>
                <div className="text-5xl mb-4">&#128269;</div>
                <h3 className="text-xl font-semibold text-brand-text mb-2">No jobs found</h3>
                <p className="text-brand-muted mb-6">
                  Try adjusting your filters or search term
                </p>
                <Link href="/jobs" className="btn-primary">
                  Clear Filters
                </Link>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">&#128188;</div>
                <h3 className="text-xl font-semibold mb-2">
                  <span className="gradient-text">No Jobs Yet</span>
                </h3>
                <p className="text-brand-muted mb-6 max-w-md mx-auto">
                  Job postings will appear here as employers post new opportunities. Check back soon!
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const rate = formatRate(job.minRate, job.maxRate)
                const skillsList = job.skills
                  ? job.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
                  : []
                const companyName =
                  job.employer.employerProfile?.companyName || job.employer.name || 'Company'

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="bg-brand-card border border-brand-border rounded-xl p-5 hover:border-brand-purple/50 transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {job.employer.employerProfile?.logoUrl ? (
                        <img
                          src={job.employer.employerProfile.logoUrl}
                          alt={companyName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-purple font-bold text-sm">
                            {companyName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-brand-text group-hover:text-brand-purple transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-brand-muted truncate">{companyName}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                        {job.category}
                      </span>
                    </div>

                    {/* Skills */}
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {skillsList.slice(0, 4).map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-md bg-brand-bg border border-brand-border text-brand-muted"
                          >
                            {skill}
                          </span>
                        ))}
                        {skillsList.length > 4 && (
                          <span className="px-2 py-0.5 text-xs rounded-md bg-brand-bg border border-brand-border text-brand-muted">
                            +{skillsList.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                      <div className="flex items-center gap-3 text-xs text-brand-muted">
                        {rate && (
                          <span className="font-medium text-brand-text">{rate}</span>
                        )}
                        <span>{timeAgo(job.createdAt)}</span>
                      </div>
                      <span className="text-xs text-brand-muted">
                        {job._count.interests} applicant{job._count.interests !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link
                    href={`/jobs?${new URLSearchParams({
                      ...searchParams,
                      page: String(page - 1),
                    } as Record<string, string>)}`}
                    className="px-4 py-2 text-sm font-medium bg-brand-card border border-brand-border rounded-lg text-brand-muted hover:border-brand-purple transition-colors"
                  >
                    Previous
                  </Link>
                )}

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1
                    return (
                      <Link
                        key={p}
                        href={`/jobs?${new URLSearchParams({
                          ...searchParams,
                          page: String(p),
                        } as Record<string, string>)}`}
                        className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                          p === page
                            ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
                            : 'bg-brand-card border border-brand-border text-brand-muted hover:border-brand-purple'
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  })}
                </div>

                {page < totalPages && (
                  <Link
                    href={`/jobs?${new URLSearchParams({
                      ...searchParams,
                      page: String(page + 1),
                    } as Record<string, string>)}`}
                    className="px-4 py-2 text-sm font-medium bg-brand-card border border-brand-border rounded-lg text-brand-muted hover:border-brand-purple transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
