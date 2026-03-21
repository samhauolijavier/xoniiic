'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Writing',
  'Video & Audio',
  'Business',
]

const AVAILABILITIES = [
  { value: 'open', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'project', label: 'One-time project' },
]

export default function PostANeedPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user as { id?: string; role?: string } | undefined

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills: '',
    minRate: '',
    maxRate: '',
    availability: 'open',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-brand-text mb-2">Sign in required</h2>
          <p className="text-brand-muted mb-6">You must be signed in as an employer to post a need.</p>
          <Link href="/login?callbackUrl=/post-a-need" className="btn-primary w-full justify-center">
            Sign In
          </Link>
          <Link href="/register?role=employer&redirect=/post-a-need" className="block mt-3 text-sm text-brand-muted hover:text-brand-text transition-colors">
            Create a free employer account
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'authenticated' && user?.role === 'seeker') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-brand-text mb-2">Employer accounts only</h2>
          <p className="text-brand-muted mb-6">Only employer accounts can post hiring needs.</p>
          <Link href="/browse" className="btn-primary w-full justify-center">
            Browse Talent Instead
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.title.trim()) {
      setError('Please enter a job title')
      setLoading(false)
      return
    }

    if (!formData.category) {
      setError('Please select a category')
      setLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError('Please add a description')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          skills: formData.skills,
          minRate: formData.minRate || undefined,
          maxRate: formData.maxRate || undefined,
          availability: formData.availability,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to post need')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/needs'), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-brand-text mb-2">Need posted!</h2>
          <p className="text-brand-muted">Your hiring need is now live. Freelancers can express interest.</p>
          <p className="text-xs text-brand-muted mt-2">Redirecting to the needs board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/needs" className="text-sm text-brand-muted hover:text-brand-text transition-colors flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Browse Needs
        </Link>
        <h1 className="text-3xl font-black text-brand-text">
          Post a <span className="gradient-text">Hiring Need</span>
        </h1>
        <p className="text-brand-muted mt-1">Let freelancers know what you&apos;re looking for</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. React Developer for SaaS App"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role, responsibilities, project scope, and ideal candidate..."
              required
              rows={5}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="input-field"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Skills Needed
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
              className="input-field"
            />
            <p className="text-xs text-brand-muted mt-1">Comma-separated list of required skills</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Min Rate ($/hr)
              </label>
              <input
                type="number"
                value={formData.minRate}
                onChange={(e) => setFormData({ ...formData, minRate: e.target.value })}
                placeholder="e.g. 20"
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Max Rate ($/hr)
              </label>
              <input
                type="number"
                value={formData.maxRate}
                onChange={(e) => setFormData({ ...formData, maxRate: e.target.value })}
                placeholder="e.g. 50"
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Availability Needed
            </label>
            <div className="flex rounded-xl overflow-hidden border border-brand-border">
              {AVAILABILITIES.map((avail) => (
                <button
                  key={avail.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, availability: avail.value })}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                    formData.availability === avail.value
                      ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
                      : 'bg-transparent text-brand-muted hover:text-brand-text'
                  }`}
                >
                  {avail.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <><span className="spinner w-4 h-4" /> Posting...</>
              ) : (
                'Post Hiring Need'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
