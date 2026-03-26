export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HireActions } from './HireActions'

export default async function HiresPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const user = session.user as { id: string; role: string; name?: string }

  const hires = await withRetry(() => db.hire.findMany({
    where: {
      OR: [
        { employerId: user.id },
        { seekerId: user.id },
      ],
    },
    include: {
      employer: {
        select: {
          id: true, name: true,
          employerProfile: { select: { companyName: true, logoUrl: true } },
        },
      },
      seeker: {
        select: {
          id: true, name: true,
          seekerProfile: { select: { avatarUrl: true, username: true, title: true } },
        },
      },
      jobNeed: { select: { id: true, title: true } },
      reviews: { select: { id: true, reviewerId: true, rating: true, type: true, comment: true, createdAt: true, reviewer: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  }))

  const active = hires.filter(h => h.status === 'active').length
  const completed = hires.filter(h => h.status === 'completed').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-brand-text">My </span>
            <span className="gradient-text">Hires</span>
          </h1>
          <p className="text-brand-muted text-sm mt-1">Track your working relationships</p>
        </div>
        {(user.role === 'employer' || user.role === 'admin') && (
          <Link href="/browse" className="btn-primary text-sm px-4 py-2">
            Browse Talent
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold gradient-text">{hires.length}</p>
          <p className="text-xs text-brand-muted">Total Hires</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{active}</p>
          <p className="text-xs text-brand-muted">Active</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-purple">{completed}</p>
          <p className="text-xs text-brand-muted">Completed</p>
        </div>
      </div>

      {hires.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <h2 className="text-xl font-semibold text-brand-text mb-2">No hires yet</h2>
          <p className="text-brand-muted text-sm mb-6">
            {user.role === 'employer'
              ? 'Browse talent and mark someone as hired to start tracking.'
              : 'When an employer hires you, it will appear here.'}
          </p>
          {(user.role === 'employer' || user.role === 'admin') && (
            <Link href="/browse" className="btn-primary text-sm px-6 py-2.5">
              Browse Talent
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {hires.map((hire) => {
            const isEmployer = hire.employerId === user.id
            const otherPerson = isEmployer ? hire.seeker : hire.employer
            const otherName = isEmployer
              ? (hire.seeker.name || 'Unknown')
              : (hire.employer.employerProfile?.companyName || hire.employer.name || 'Unknown')
            const otherAvatar = isEmployer
              ? hire.seeker.seekerProfile?.avatarUrl
              : hire.employer.employerProfile?.logoUrl
            const otherTitle = isEmployer
              ? hire.seeker.seekerProfile?.title
              : null
            const myReview = hire.reviews.find(r => r.reviewerId === user.id)
            const theirReview = hire.reviews.find(r => r.reviewerId !== user.id)

            return (
              <div key={hire.id} className="card p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {otherAvatar ? (
                      <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      otherName[0]?.toUpperCase() || '?'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-brand-text">{hire.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        hire.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        hire.status === 'completed' ? 'bg-brand-purple/20 text-brand-purple' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {hire.status}
                      </span>
                    </div>

                    <p className="text-sm text-brand-muted mt-0.5">
                      {isEmployer ? 'Hired: ' : 'Employer: '}
                      <span className="text-brand-text">{otherName}</span>
                      {otherTitle && <span className="text-brand-muted"> · {otherTitle}</span>}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted">
                      {hire.rateAgreed && (
                        <span>${hire.rateAgreed}/{hire.rateType || 'hr'}</span>
                      )}
                      <span>Started {new Date(hire.startDate).toLocaleDateString()}</span>
                      {hire.endDate && (
                        <span>Ended {new Date(hire.endDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Reviews display */}
                    {hire.reviews.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {hire.reviews.map((review) => (
                          <div key={review.id} className="bg-brand-border/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <span key={star} className={`text-sm ${star <= review.rating ? 'text-amber-400' : 'text-brand-border'}`}>★</span>
                                ))}
                              </div>
                              <span className="text-xs text-brand-muted">by {review.reviewer.name || 'Anonymous'}</span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-brand-text/80 mt-1">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <HireActions
                    hireId={hire.id}
                    status={hire.status}
                    isEmployer={isEmployer}
                    hasReviewed={!!myReview}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
