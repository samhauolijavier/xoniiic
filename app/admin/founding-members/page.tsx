'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FoundingMemberBadge } from '@/components/ui/FoundingMemberBadge'

interface ReservedSlot {
  number: number
  assigned: { id: string; name: string | null; email: string; role: string } | null
}

interface FoundingMember {
  number: number
  name: string | null
  email: string
  role: string
  userId: string
  joinedAt: string
}

interface FoundingMemberData {
  totalAssigned: number
  maxSlots: number
  reservedSlots: ReservedSlot[]
  foundingMembers: FoundingMember[]
}

export default function FoundingMembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<FoundingMemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignEmail, setAssignEmail] = useState('')
  const [assignSlot, setAssignSlot] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    const user = session?.user as { role?: string } | undefined
    if (user && user.role !== 'admin') router.push('/')
  }, [status, session, router])

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/founding-member')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      console.error('Failed to fetch founding members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleAssign(slot: number) {
    if (!assignEmail.trim()) {
      setError('Please enter an email address')
      return
    }
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      // First find the user by email
      const searchRes = await fetch(`/api/admin/founding-member/search?email=${encodeURIComponent(assignEmail.trim())}`)
      if (!searchRes.ok) {
        const err = await searchRes.json()
        setError(err.error || 'User not found')
        setActionLoading(false)
        return
      }
      const { userId } = await searchRes.json()

      const res = await fetch('/api/admin/founding-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, number: slot }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to assign')
      } else {
        setSuccess(`Assigned Founding Member #${slot} successfully`)
        setAssignEmail('')
        setAssignSlot(null)
        await fetchData()
      }
    } catch {
      setError('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRevoke(userId: string, number: number) {
    if (!confirm(`Remove Founding Member #${number} badge from this user?`)) return
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/founding-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, number: null }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to revoke')
      } else {
        setSuccess(`Revoked badge #${number} successfully`)
        await fetchData()
      }
    } catch {
      setError('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20 text-brand-muted">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20 text-brand-muted">Failed to load data</div>
      </div>
    )
  }

  const regularMembers = data.foundingMembers.filter(m => m.number > 10)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
            Founding Members <span className="gradient-text">(First 250)</span>
          </h1>
          <p className="text-brand-muted mt-1">Manage the exclusive founding member badges</p>
        </div>
        <Link href="/admin" className="btn-secondary text-sm">
          Back to Admin
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-2xl font-black gradient-text">{data.totalAssigned}</div>
          <div className="text-xs text-brand-muted">Total Assigned</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-black gradient-text">{data.maxSlots - data.totalAssigned}</div>
          <div className="text-xs text-brand-muted">Remaining</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-black gradient-text">
            {data.reservedSlots.filter(s => s.assigned).length}/10
          </div>
          <div className="text-xs text-brand-muted">Inner Circle Filled</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-black gradient-text">{data.maxSlots}</div>
          <div className="text-xs text-brand-muted">Max Slots</div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {/* Inner Circle (#1-10) */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
          <span className="text-xl">{'\u{1F451}'}</span> Inner Circle (1-10)
        </h2>
        <p className="text-sm text-brand-muted mb-4">
          Reserved slots for admin to manually assign to hand-picked members.
        </p>
        <div className="space-y-3">
          {data.reservedSlots.map((slot) => (
            <div
              key={slot.number}
              className="flex items-center gap-4 p-3 rounded-xl bg-brand-border/30 border border-brand-border"
            >
              <FoundingMemberBadge number={slot.number} size="sm" />
              {slot.assigned ? (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text">{slot.assigned.name || 'Unnamed'}</p>
                    <p className="text-xs text-brand-muted">{slot.assigned.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    slot.assigned.role === 'admin' ? 'bg-orange-900/40 text-orange-400' :
                    slot.assigned.role === 'employer' ? 'bg-blue-900/40 text-blue-400' :
                    'bg-purple-900/40 text-purple-400'
                  }`}>
                    {slot.assigned.role}
                  </span>
                  <button
                    onClick={() => handleRevoke(slot.assigned!.id, slot.number)}
                    disabled={actionLoading}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    {assignSlot === slot.number ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          placeholder="user@email.com"
                          value={assignEmail}
                          onChange={(e) => setAssignEmail(e.target.value)}
                          className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-purple"
                        />
                        <button
                          onClick={() => handleAssign(slot.number)}
                          disabled={actionLoading}
                          className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                        >
                          {actionLoading ? 'Assigning...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => { setAssignSlot(null); setAssignEmail(''); setError('') }}
                          className="text-xs text-brand-muted hover:text-brand-text"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-brand-muted italic">Unassigned</span>
                    )}
                  </div>
                  {assignSlot !== slot.number && (
                    <button
                      onClick={() => { setAssignSlot(slot.number); setError(''); setSuccess('') }}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      Assign
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Founding Members Table */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-brand-text mb-4">All Founding Members</h2>
        {data.foundingMembers.length === 0 ? (
          <div className="text-center py-8 text-brand-muted text-sm">
            No founding members assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-brand-muted border-b border-brand-border">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {data.foundingMembers.map((member) => (
                  <tr key={member.userId} className="text-brand-text hover:bg-brand-border/20 transition-colors">
                    <td className="py-3">
                      <FoundingMemberBadge number={member.number} size="sm" />
                    </td>
                    <td className="py-3">{member.name || '-'}</td>
                    <td className="py-3 text-brand-muted">{member.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-orange-900/40 text-orange-400' :
                        member.role === 'employer' ? 'bg-blue-900/40 text-blue-400' :
                        'bg-purple-900/40 text-purple-400'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 text-brand-muted text-xs">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleRevoke(member.userId, member.number)}
                        disabled={actionLoading}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
