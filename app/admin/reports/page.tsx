export const dynamic = "force-dynamic"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminReportActions } from './AdminReportActions'

const REASON_LABELS: Record<string, string> = {
  scam: 'Scam / Fraud',
  spam: 'Spam',
  fake: 'Fake Profile',
  inappropriate: 'Inappropriate Content',
  unpaid: 'Unpaid Work',
  other: 'Other',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30',
  reviewed: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
  dismissed: 'bg-brand-border text-brand-muted border-brand-border',
  actioned: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30',
}

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as { id: string; role: string }
  if (user.role !== 'admin') redirect('/')

  const reports = await db.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      seekerProfile: { select: { id: true, username: true, user: { select: { name: true } } } },
      employerProfile: { select: { id: true, companyName: true, userId: true, user: { select: { name: true } } } },
      response: { select: { message: true, createdAt: true, user: { select: { name: true, email: true } } } },
    },
  })

  const pendingCount = reports.filter((r) => r.status === 'pending').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-brand-text">
            User <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-brand-muted mt-1">
            {pendingCount} pending report{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/40 rounded-xl">
            <span className="text-yellow-400 font-semibold">{pendingCount} pending</span>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="px-6 py-4 font-medium">Reporter</th>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Response</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {reports.map((report) => {
                const targetLabel = report.seekerProfile
                  ? report.seekerProfile.user.name || report.seekerProfile.username
                  : report.employerProfile
                    ? report.employerProfile.companyName || report.employerProfile.user.name || 'Employer'
                    : 'Unknown'

                const targetHref = report.seekerProfile
                  ? `/talent/${report.seekerProfile.username}`
                  : report.employerProfile
                    ? `/employers/${report.employerProfile.userId}`
                    : null

                return (
                  <tr key={report.id} className="text-brand-text hover:bg-brand-border/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{report.reporter.name || '-'}</p>
                        <p className="text-xs text-brand-muted">{report.reporter.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {targetHref ? (
                        <Link href={targetHref} className="text-brand-orange hover:underline text-sm">
                          {targetLabel}
                        </Link>
                      ) : (
                        <span className="text-brand-muted">{targetLabel}</span>
                      )}
                      <p className="text-xs text-brand-muted mt-0.5">
                        {report.seekerProfile ? 'Freelancer' : 'Employer'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-brand-muted">{REASON_LABELS[report.reason] || report.reason}</span>
                    </td>
                    <td className="px-6 py-4 max-w-48">
                      <p className="text-brand-muted text-xs truncate">
                        {report.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-brand-muted text-xs">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLES[report.status] || STATUS_STYLES.pending}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {report.response ? (
                        <div className="group relative">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-purple/20 text-brand-purple border border-brand-purple/30 cursor-default">
                            Submitted
                          </span>
                          <div className="absolute left-0 top-full mt-1 w-64 p-3 bg-brand-card border border-brand-border rounded-xl shadow-card z-10 hidden group-hover:block">
                            <p className="text-xs text-brand-muted mb-1">
                              From: {report.response.user.name || report.response.user.email}
                            </p>
                            <p className="text-xs text-brand-text leading-relaxed">
                              {report.response.message}
                            </p>
                            <p className="text-xs text-brand-muted mt-1">
                              {new Date(report.response.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'pending' || report.status === 'reviewed' ? (
                        <AdminReportActions reportId={report.id} currentStatus={report.status} />
                      ) : (
                        <span className="text-xs text-brand-muted">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12 text-brand-muted">
            No reports submitted yet.
          </div>
        )}
      </div>
    </div>
  )
}
