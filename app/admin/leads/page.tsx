'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SeekerProfile {
  username: string | null
  location: string | null
  title: string | null
  hourlyRate: number | null
  skills: { id: string }[]
}

interface EmployerProfile {
  companyName: string | null
  website: string | null
  verified: boolean
  verificationTier: string | null
}

interface LeadUser {
  id: string
  name: string | null
  email: string
  role: string
  active: boolean
  createdAt: string
  seekerProfile: SeekerProfile | null
  employerProfile: EmployerProfile | null
}

interface Stats {
  totalUsers: number
  totalSeekers: number
  totalEmployers: number
  newThisWeek: number
  newThisMonth: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminLeadsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<LeadUser[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const user = session?.user as { id: string; role: string } | undefined

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      params.set('page', String(page))
      params.set('limit', '20')
      params.set('format', 'json')
      if (search) params.set('search', search)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/admin/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUsers(data.users)
      setStats(data.stats)
      setPagination(data.pagination)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [role, search, fromDate, toDate, page])

  useEffect(() => {
    if (status === 'loading') return
    if (!session || user?.role !== 'admin') {
      router.push('/')
      return
    }
    fetchLeads()
  }, [status, session, user?.role, router, fetchLeads])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      params.set('format', 'csv')
      if (search) params.set('search', search)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/admin/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `virtualfreaks-leads-${role}-${dateStr}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silent
    } finally {
      setExporting(false)
    }
  }

  const isNewUser = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    return diff < 7 * 24 * 60 * 60 * 1000
  }

  if (status === 'loading' || (status === 'authenticated' && loading && !stats)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-brand-card rounded w-48" />
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-brand-card rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-brand-card rounded-xl" />
        </div>
      </div>
    )
  }

  const roleFilterClasses = (val: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      role === val
        ? 'bg-brand-purple text-white'
        : 'bg-brand-card text-brand-muted hover:text-brand-text border border-brand-border'
    }`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/admin" className="text-brand-muted hover:text-brand-text transition-colors text-sm">
            &larr; Admin
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
          <span className="gradient-text">Lead List</span>
        </h1>
        <p className="text-brand-muted mt-1">All registered users on the platform</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'from-blue-600 to-purple-600', icon: '\uD83D\uDC65' },
            { label: 'Freelancers', value: stats.totalSeekers, color: 'from-purple-600 to-pink-600', icon: '\uD83E\uDDD1\u200D\uD83D\uDCBB' },
            { label: 'Employers', value: stats.totalEmployers, color: 'from-amber-500 to-orange-500', icon: '\uD83C\uDFE2' },
            { label: 'New This Week', value: stats.newThisWeek, color: 'from-emerald-600 to-teal-500', icon: '\uD83D\uDCC8' },
            { label: 'New This Month', value: stats.newThisMonth, color: 'from-rose-600 to-pink-600', icon: '\uD83D\uDCC5' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-3`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-black gradient-text">{stat.value}</div>
              <div className="text-xs text-brand-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters Row */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Role filter */}
          <div className="flex gap-2">
            <button onClick={() => { setRole('all'); setPage(1) }} className={roleFilterClasses('all')}>
              All
            </button>
            <button onClick={() => { setRole('seeker'); setPage(1) }} className={roleFilterClasses('seeker')}>
              Freelancers
            </button>
            <button onClick={() => { setRole('employer'); setPage(1) }} className={roleFilterClasses('employer')}>
              Employers
            </button>
          </div>

          <div className="h-8 w-px bg-brand-border hidden sm:block" />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-purple"
              placeholder="From"
            />
            <span className="text-brand-muted text-sm">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="h-8 w-px bg-brand-border hidden sm:block" />

          {/* Search */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Search name or email..."
              className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-purple w-48"
            />
            <button onClick={handleSearch} className="btn-secondary text-sm py-2 px-3">
              Search
            </button>
          </div>

          <div className="ml-auto">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full mx-auto" />
              <p className="text-brand-muted text-sm mt-3">Loading leads...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-brand-muted text-lg">No leads found matching your filters</p>
              <p className="text-brand-muted text-sm mt-1">Try adjusting your search or date range</p>
            </div>
          ) : role === 'employer' ? (
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-left text-brand-muted border-b border-brand-border">
                  <th className="px-4 py-3 font-medium">Company Name</th>
                  <th className="px-4 py-3 font-medium">Contact Email</th>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Joined Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="text-brand-text hover:bg-brand-border/20 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/employers`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isNewUser(u.createdAt) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-400 uppercase">New</span>
                        )}
                        <span>{u.employerProfile?.companyName || u.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.employerProfile?.website ? (
                        <span className="text-brand-purple truncate max-w-[200px] block">{u.employerProfile.website}</span>
                      ) : (
                        <span className="text-brand-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.employerProfile?.verified ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-900/40 text-emerald-400">Verified</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-brand-muted">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.employerProfile?.verificationTier ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.employerProfile.verificationTier === 'vf_verified'
                            ? 'bg-purple-900/40 text-purple-400'
                            : 'bg-blue-900/40 text-blue-400'
                        }`}>
                          {u.employerProfile.verificationTier === 'vf_verified' ? 'VF Verified' : 'Partner'}
                        </span>
                      ) : (
                        <span className="text-brand-muted text-xs">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        u.active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
                      }`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left text-brand-muted border-b border-brand-border">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Hourly Rate</th>
                  <th className="px-4 py-3 font-medium">Joined Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="text-brand-text hover:bg-brand-border/20 transition-colors cursor-pointer"
                    onClick={() => {
                      if (u.role === 'seeker' && u.seekerProfile?.username) {
                        router.push(`/talent/${u.seekerProfile.username}`)
                      } else if (u.role === 'employer') {
                        router.push(`/admin/employers`)
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isNewUser(u.createdAt) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-400 uppercase">New</span>
                        )}
                        <span>{u.role === 'employer' ? (u.employerProfile?.companyName || u.name || '-') : (u.name || '-')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'employer' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'
                      }`}>
                        {u.role === 'seeker' ? 'Freelancer' : 'Employer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs">{u.seekerProfile?.location || '-'}</td>
                    <td className="px-4 py-3 text-brand-muted text-xs">{u.seekerProfile?.title || '-'}</td>
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {u.seekerProfile?.hourlyRate != null ? `$${u.seekerProfile.hourlyRate}/hr` : '-'}
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        u.active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
                      }`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
            <p className="text-sm text-brand-muted">
              Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-brand-card border border-brand-border text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                      page === pageNum
                        ? 'bg-brand-purple text-white'
                        : 'bg-brand-card border border-brand-border text-brand-muted hover:text-brand-text'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-brand-card border border-brand-border text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
