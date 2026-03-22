export const dynamic = "force-dynamic"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { VerifiedPartnerBadge } from '@/components/ui/VerifiedPartnerBadge'
import { VFVerifiedBadge } from '@/components/ui/VFVerifiedBadge'
import { AdminEmployerActions } from './AdminEmployerActions'

export default async function AdminEmployersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as { id: string; role: string }
  if (user.role !== 'admin') redirect('/')

  const employers = await db.user.findMany({
    where: { role: 'employer' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      active: true,
      premium: true,
      employerProfile: {
        select: {
          id: true,
          companyName: true,
          website: true,
          linkedIn: true,
          verified: true,
          verifiedAt: true,
          verificationTier: true,
          createdAt: true,
          _count: { select: { reviewsReceived: true } },
        },
      },
    },
  })

  const pendingCount = employers.filter(
    (e) => !e.employerProfile?.verified
  ).length
  const partnerCount = employers.filter((e) => e.premium).length
  const vfVerifiedCount = employers.filter(
    (e) => e.employerProfile?.verificationTier === 'vf_verified'
  ).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
            Employer <span className="gradient-text">Management</span>
          </h1>
          <p className="text-brand-muted mt-1">
            {employers.length} total employers
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 bg-orange-900/30 border border-orange-700/40 rounded-xl">
              <span className="text-orange-400 font-semibold text-sm">{pendingCount} pending</span>
            </div>
          )}
          <div className="px-3 py-1.5 bg-brand-purple/10 border border-brand-purple/30 rounded-xl">
            <span className="text-purple-400 font-semibold text-sm">{partnerCount} partners</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-900/30 border border-emerald-700/40 rounded-xl">
            <span className="text-emerald-400 font-semibold text-sm">{vfVerifiedCount} VF verified</span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="px-4 sm:px-6 py-4 font-medium">Employer</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Company</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Links</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Reviews</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Joined</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Status</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {employers.map((employer) => {
                const tier = employer.employerProfile?.verificationTier
                return (
                  <tr key={employer.id} className="text-brand-text hover:bg-brand-border/20 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <p className="font-medium">{employer.name || '-'}</p>
                        <p className="text-xs text-brand-muted">{employer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-brand-muted">
                        {employer.employerProfile?.companyName || '-'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {employer.employerProfile?.website && (
                          <a
                            href={employer.employerProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-orange hover:underline text-xs truncate max-w-32"
                          >
                            Website
                          </a>
                        )}
                        {employer.employerProfile?.linkedIn && (
                          <a
                            href={employer.employerProfile.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-orange hover:underline text-xs"
                          >
                            LinkedIn
                          </a>
                        )}
                        {!employer.employerProfile?.website && !employer.employerProfile?.linkedIn && (
                          <span className="text-xs text-brand-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-muted">
                      {employer.employerProfile?._count.reviewsReceived ?? 0}
                    </td>
                    <td className="px-6 py-4 text-brand-muted text-xs">
                      {new Date(employer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {tier === 'vf_verified' ? (
                          <VFVerifiedBadge />
                        ) : employer.premium ? (
                          <VerifiedPartnerBadge />
                        ) : employer.employerProfile?.verified ? (
                          <VerifiedBadge />
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-700/30 inline-flex w-fit">
                            Pending
                          </span>
                        )}
                        {employer.premium && (
                          <span className="text-xs text-purple-400">Paying $12.99/mo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <AdminEmployerActions
                        userId={employer.id}
                        isVerified={employer.employerProfile?.verified ?? false}
                        verificationTier={tier ?? null}
                        isPremium={employer.premium}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {employers.length === 0 && (
          <div className="text-center py-12 text-brand-muted">
            No employers registered yet.
          </div>
        )}
      </div>
    </div>
  )
}
