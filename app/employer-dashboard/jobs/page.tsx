'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

interface Job {
  id: string
  title: string
  description: string
  category: string
  skills: string
  minRate: number | null
  maxRate: number | null
  availability: string
  status: string
  createdAt: string
  _count: { interests: number }
}

interface JobFormData {
  title: string
  description: string
  category: string
  skills: string
  minRate: string
  maxRate: string
  availability: string
}

const emptyForm: JobFormData = {
  title: '',
  description: '',
  category: 'Development',
  skills: '',
  minRate: '',
  maxRate: '',
  availability: 'open',
}

export default function EmployerJobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<JobFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const user = session?.user as { id: string; role: string } | undefined

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/jobs?mine=1')
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load jobs')
        return
      }

      setJobs(data.jobs || [])
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }
    if (user?.role !== 'employer' && user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchJobs()
  }, [session, status, router, user?.role, fetchJobs])

  function openCreateForm() {
    setFormData(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
    setSuccessMsg('')
  }

  function openEditForm(job: Job) {
    setFormData({
      title: job.title,
      description: job.description,
      category: job.category,
      skills: job.skills,
      minRate: job.minRate?.toString() || '',
      maxRate: job.maxRate?.toString() || '',
      availability: job.availability,
    })
    setEditingId(job.id)
    setShowForm(true)
    setError('')
    setSuccessMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMsg('')

    try {
      const url = editingId ? `/api/jobs/${editingId}` : '/api/jobs'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          skills: formData.skills,
          minRate: formData.minRate || null,
          maxRate: formData.maxRate || null,
          availability: formData.availability,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || data.message || 'Failed to save job')
        return
      }

      setSuccessMsg(editingId ? 'Job updated successfully' : 'Job posted successfully')
      setShowForm(false)
      setEditingId(null)
      setFormData(emptyForm)
      fetchJobs()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(jobId: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete job')
        return
      }

      setSuccessMsg('Job deleted successfully')
      fetchJobs()
    } catch {
      setError('Failed to delete job')
    }
  }

  async function handleToggleStatus(jobId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update status')
        return
      }

      fetchJobs()
    } catch {
      setError('Failed to update status')
    }
  }

  function timeAgo(date: string) {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-brand-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-brand-card rounded w-1/3" />
            <div className="h-4 bg-brand-card rounded w-1/4" />
            <div className="space-y-3 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-brand-card rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/employer-dashboard"
                className="text-brand-muted hover:text-brand-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
                Manage <span className="gradient-text">Jobs</span>
              </h1>
            </div>
            <p className="text-brand-muted">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} posted
            </p>
          </div>
          <button onClick={openCreateForm} className="btn-primary px-5 py-2 font-semibold">
            + Post New Job
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            {successMsg}
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-brand-text">
                {editingId ? 'Edit Job Posting' : 'Create New Job Posting'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setError('')
                }}
                className="text-brand-muted hover:text-brand-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-brand-muted mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior React Developer"
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-brand-muted mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-brand-muted mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-purple transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-brand-muted mb-1">
                    Availability
                  </label>
                  <select
                    id="availability"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-purple transition-colors"
                  >
                    <option value="open">Open</option>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-brand-muted mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors"
                />
              </div>

              {/* Rate Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minRate" className="block text-sm font-medium text-brand-muted mb-1">
                    Min Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    id="minRate"
                    min="0"
                    value={formData.minRate}
                    onChange={(e) => setFormData({ ...formData, minRate: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="maxRate" className="block text-sm font-medium text-brand-muted mb-1">
                    Max Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    id="maxRate"
                    min="0"
                    value={formData.maxRate}
                    onChange={(e) => setFormData({ ...formData, maxRate: e.target.value })}
                    placeholder="Any"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-6 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? 'Saving...'
                    : editingId
                    ? 'Update Job'
                    : 'Post Job'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setError('')
                  }}
                  className="px-6 py-2 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Job List */}
        {jobs.length === 0 && !showForm ? (
          <div className="bg-brand-card border border-brand-border rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">&#128188;</div>
            <h3 className="text-xl font-semibold mb-2">
              <span className="gradient-text">No Jobs Posted Yet</span>
            </h3>
            <p className="text-brand-muted mb-6 max-w-md mx-auto">
              Post your first job to start finding talented freelancers on Virtual Freaks.
            </p>
            <button onClick={openCreateForm} className="btn-primary px-6 py-2 font-semibold">
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const skillsList = job.skills
                ? job.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : []

              return (
                <div
                  key={job.id}
                  className={`bg-brand-card border rounded-xl p-5 transition-all ${
                    job.status === 'active'
                      ? 'border-brand-border'
                      : 'border-brand-border/50 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-semibold text-brand-text hover:text-brand-purple transition-colors truncate"
                        >
                          {job.title}
                        </Link>
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
                            job.status === 'active'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-brand-muted mb-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                          {job.category}
                        </span>
                        {job.minRate || job.maxRate ? (
                          <span>
                            {job.minRate && job.maxRate
                              ? `$${job.minRate} - $${job.maxRate}/hr`
                              : job.minRate
                              ? `From $${job.minRate}/hr`
                              : `Up to $${job.maxRate}/hr`}
                          </span>
                        ) : null}
                        <span>Posted {timeAgo(job.createdAt)}</span>
                      </div>

                      {skillsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {skillsList.slice(0, 5).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-md bg-brand-bg border border-brand-border text-brand-muted"
                            >
                              {skill}
                            </span>
                          ))}
                          {skillsList.length > 5 && (
                            <span className="px-2 py-0.5 text-xs text-brand-muted">
                              +{skillsList.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-sm text-brand-muted">
                        <span className="font-medium text-brand-text">{job._count.interests}</span>{' '}
                        applicant{job._count.interests !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleStatus(job.id, job.status)}
                        className="p-2 text-brand-muted hover:text-brand-text transition-colors"
                        title={job.status === 'active' ? 'Pause job' : 'Activate job'}
                      >
                        {job.status === 'active' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => openEditForm(job)}
                        className="p-2 text-brand-muted hover:text-brand-purple transition-colors"
                        title="Edit job"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(job.id, job.title)}
                        className="p-2 text-brand-muted hover:text-red-400 transition-colors"
                        title="Delete job"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
