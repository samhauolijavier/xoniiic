export const dynamic = "force-dynamic"
import { Suspense } from 'react'
import { FilterPanel } from '@/components/employer/FilterPanel'
import { ProfileCard } from '@/components/seeker/ProfileCard'
import { TrendingSkills } from '@/components/ui/TrendingSkills'
import { SaveSearchButton } from '@/components/employer/SaveSearchButton'
import { SearchMatchChecker } from '@/components/employer/SearchMatchChecker'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isMonetizationEnabled } from '@/lib/monetization'
import { excludeDemoAccounts } from '@/lib/constants'

interface SearchParams {
  page?: string
  search?: string
  category?: string
  availability?: string
  minRate?: string
  maxRate?: string
  minEnglish?: string
  featured?: string
  onlineNow?: string
}

async function getSeekers(params: SearchParams) {
  const page = parseInt(params.page || '1')
  const limit = 12
  const skip = (page - 1) * limit

  const where: Prisma.SeekerProfileWhereInput = {
    user: { active: true, ...excludeDemoAccounts() },
    openToWork: true,
  }

  if (params.featured === 'true') where.featured = true
  if (params.availability) where.availability = params.availability
  if (params.minRate) where.hourlyRate = { ...((where.hourlyRate as object) || {}), gte: parseFloat(params.minRate) }
  if (params.maxRate) where.hourlyRate = { ...((where.hourlyRate as object) || {}), lte: parseFloat(params.maxRate) }
  if (params.minEnglish) where.englishRating = { gte: parseInt(params.minEnglish) }
  if (params.onlineNow === 'true') {
    where.lastActiveAt = { gte: new Date(Date.now() - 30 * 60 * 1000) }
  }

  if (params.search) {
    where.OR = [
      { username: { contains: params.search } },
      { bio: { contains: params.search } },
      { location: { contains: params.search } },
      { user: { name: { contains: params.search } } },
      { skills: { some: { skill: { name: { contains: params.search } } } } },
    ]
  }

  if (params.category) {
    where.skills = { some: { skill: { category: params.category } } }
  }

  const [profiles, total] = await Promise.all([
    db.seekerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ featured: 'desc' }, { profileViews: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, email: true, premium: true, foundingMemberNumber: true } },
        skills: { include: { skill: true }, orderBy: { rating: 'desc' } },
      },
    }),
    db.seekerProfile.count({ where }),
  ])

  return { profiles, total, page, totalPages: Math.ceil(total / limit) }
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/register?role=employer&redirect=/browse')
  }

  // Track skill search for trending
  if (searchParams.category) {
    try {
      await db.skillSearch.create({
        data: { skillName: searchParams.category, category: searchParams.category },
      })
    } catch { /* silent */ }
  }

  let profiles: Awaited<ReturnType<typeof getSeekers>>['profiles'] = []
  let total = 0
  let page = 1
  let totalPages = 1
  let dbError = false

  try {
    const result = await getSeekers(searchParams)
    profiles = result.profiles
    total = result.total
    page = result.page
    totalPages = result.totalPages
  } catch (error) {
    console.error('Browse page DB query failed:', error)
    dbError = true
  }

  const sessionUser = session.user as { id: string; role: string }
  const monetizationOn = await isMonetizationEnabled().catch(() => false)

  const activeFilters = [
    searchParams.search && `"${searchParams.search}"`,
    searchParams.category,
    searchParams.availability && `${searchParams.availability} only`,
    searchParams.minRate && `$${searchParams.minRate}+/hr`,
    searchParams.onlineNow === 'true' && 'Online Now',
  ].filter(Boolean)

  const isEmployer = sessionUser.role === 'employer'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search match checker for employers */}
      {isEmployer && <SearchMatchChecker />}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
          Browse{' '}
          <span className="gradient-text">Remote Talent</span>
        </h1>
        <p className="text-brand-muted mt-1">
          {total} talented freelancers available
          {searchParams.category && ` in ${searchParams.category}`}
        </p>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-brand-muted">Filters:</span>
            {activeFilters.map((f, i) => (
              <span key={i} className="skill-tag text-xs">{f}</span>
            ))}
          </div>
        )}

        {/* Save Search Button for employers */}
        {isEmployer && (
          <div className="mt-3">
            <SaveSearchButton searchParams={{
              search: searchParams.search,
              category: searchParams.category,
              availability: searchParams.availability,
              minRate: searchParams.minRate,
              maxRate: searchParams.maxRate,
              minEnglish: searchParams.minEnglish,
              onlineNow: searchParams.onlineNow,
            }} />
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filter */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <TrendingSkills />
          <Suspense fallback={<div className="card p-5 animate-pulse h-96" />}>
            <FilterPanel />
          </Suspense>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Mobile filters */}
          <div className="lg:hidden mb-4">
            <Suspense fallback={null}>
              <FilterPanel />
            </Suspense>
          </div>

          {dbError ? (
            <div className="card p-16 text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-brand-text mb-2">Temporarily unavailable</h3>
              <p className="text-brand-muted mb-6">We&apos;re having trouble loading profiles right now. Please try again in a moment.</p>
              <Link href="/browse" className="btn-primary">Try Again</Link>
            </div>
          ) : profiles.length === 0 ? (
            activeFilters.length > 0 ? (
              <div className="card p-16 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-brand-text mb-2">No results found</h3>
                <p className="text-brand-muted mb-6">Try adjusting your filters or search term</p>
                <Link href="/browse" className="btn-primary">Clear Filters</Link>
              </div>
            ) : (
              <div className="card p-16 text-center border-brand-purple/30 bg-gradient-to-br from-brand-purple/5 to-brand-orange/5">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">
                  <span className="gradient-text">We&apos;re Just Getting Started!</span>
                </h3>
                <p className="text-brand-muted mb-6 max-w-md mx-auto">
                  More talented freelancers join every day. Check back soon or invite someone to join!
                </p>
                <Link href="/register?role=seeker" className="btn-primary">Invite a Freelancer</Link>
              </div>
            )
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {profiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} hideMonetization={!monetizationOn} hideRate={sessionUser.role === 'seeker'} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link
                      href={`/browse?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                      className="btn-secondary text-sm px-4 py-2"
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
                          href={`/browse?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
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
                      href={`/browse?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                      className="btn-secondary text-sm px-4 py-2"
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
    </div>
  )
}
