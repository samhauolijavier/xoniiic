'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const features = [
  { label: 'Browse talent profiles', free: true, partner: true },
  { label: 'Send contact requests', free: '5/month', partner: 'Unlimited' },
  { label: 'Post job needs', free: '2 active', partner: 'Unlimited' },
  { label: 'Save & shortlist talent', free: true, partner: true },
  { label: 'Verified Partner badge', free: false, partner: true },
  { label: 'Priority in seeker notifications', free: false, partner: true },
  { label: 'Advanced search filters', free: false, partner: true },
  { label: 'Bulk contact (up to 10 at once)', free: false, partner: true },
  { label: '"Hiring Now" spotlight on browse', free: false, partner: true },
  { label: 'Hiring analytics dashboard', free: false, partner: true },
  { label: 'Submit reports on seekers', free: false, partner: true },
  { label: 'Export talent lists to CSV', free: false, partner: true },
]

export default function VerifiedPartnerPage() {
  const { data: session } = useSession()
  const user = session?.user as { id: string; role: string; name?: string | null } | undefined

  const [isPartner, setIsPartner] = useState(false)
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null)
  const [contactsThisMonth, setContactsThisMonth] = useState(0)
  const [activeJobPosts, setActiveJobPosts] = useState(0)
  const [contactsRemaining, setContactsRemaining] = useState<number | null>(null)
  const [jobPostsRemaining, setJobPostsRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [monetizationEnabled, setMonetizationEnabled] = useState(true)
  const [monetizationLoading, setMonetizationLoading] = useState(true)

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((data) => {
        setMonetizationEnabled(data.monetization_enabled === 'true')
      })
      .catch(() => {})
      .finally(() => setMonetizationLoading(false))
  }, [])

  useEffect(() => {
    if (!session || user?.role !== 'employer') {
      setStatusLoading(false)
      return
    }
    fetch('/api/employer-premium/status')
      .then((r) => r.json())
      .then((data) => {
        setIsPartner(data.isPartner ?? false)
        setPremiumUntil(data.premiumUntil ?? null)
        setContactsThisMonth(data.contactsThisMonth ?? 0)
        setActiveJobPosts(data.activeJobPosts ?? 0)
        setContactsRemaining(data.contactsRemaining ?? null)
        setJobPostsRemaining(data.jobPostsRemaining ?? null)
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false))
  }, [session, user?.role])

  const handleUpgrade = async () => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/employer-premium/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/premium/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isEmployer = user?.role === 'employer'

  if (!monetizationLoading && !monetizationEnabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-6xl mb-6">🚀</div>
          <h1 className="text-3xl sm:text-5xl font-black text-brand-text mb-4">
            <span className="gradient-text">Verified Partner</span> is Coming Soon!
          </h1>
          <p className="text-lg text-brand-muted max-w-xl mx-auto mb-8">
            Verified Partner program is coming soon! Stay tuned.
          </p>
          <Link href="/employer-dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ─── PARTNER DASHBOARD VIEW ───────────────────────────────────────────
  if (!statusLoading && isPartner) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Partner Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-purple-300 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verified Partner
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-brand-text mb-2">
            Welcome back, <span className="gradient-text">{user?.name || 'Partner'}</span>
          </h1>
          <p className="text-brand-muted">
            Your partner perks are active
            {premiumUntil && (
              <> through <span className="text-brand-text font-medium">
                {new Date(premiumUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span></>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/browse" className="card p-5 text-center border-brand-purple/20 hover:border-brand-purple/50 transition-all group">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-bold text-brand-text mb-1 group-hover:gradient-text transition-all">Browse Talent</h3>
            <p className="text-xs text-brand-muted">Find your next hire</p>
          </Link>
          <Link href="/post-a-need" className="card p-5 text-center border-brand-purple/20 hover:border-brand-purple/50 transition-all group">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-brand-text mb-1 group-hover:gradient-text transition-all">Post a Job Need</h3>
            <p className="text-xs text-brand-muted">Unlimited posts available</p>
          </Link>
          <Link href="/saved" className="card p-5 text-center border-brand-purple/20 hover:border-brand-purple/50 transition-all group">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-bold text-brand-text mb-1 group-hover:gradient-text transition-all">Saved Talent</h3>
            <p className="text-xs text-brand-muted">Your shortlisted candidates</p>
          </Link>
        </div>

        {/* Your Activity This Month */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
            <span>📊</span> Your Activity This Month
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border text-center">
              <div className="text-2xl font-black gradient-text">{contactsThisMonth}</div>
              <div className="text-xs text-brand-muted mt-1">Contacts Sent</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border text-center">
              <div className="text-2xl font-black gradient-text">{activeJobPosts}</div>
              <div className="text-xs text-brand-muted mt-1">Active Job Posts</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border text-center">
              <div className="text-2xl font-black text-emerald-400">✓</div>
              <div className="text-xs text-brand-muted mt-1">Verified Badge</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border text-center">
              <div className="text-2xl font-black text-purple-400">∞</div>
              <div className="text-xs text-brand-muted mt-1">No Limits</div>
            </div>
          </div>
        </div>

        {/* Your Partner Perks */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
            <span>🛡️</span> Your Partner Perks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '💬', label: 'Unlimited contact requests', desc: 'No monthly cap on reaching out to talent' },
              { icon: '📋', label: 'Unlimited job posts', desc: 'Post as many openings as you need' },
              { icon: '🛡️', label: 'Verified Partner badge', desc: 'Builds trust — seekers respond faster' },
              { icon: '🔔', label: 'Priority notifications', desc: 'Your messages show up first for seekers' },
              { icon: '🔍', label: 'Advanced search filters', desc: 'Filter by activity, response time, badges' },
              { icon: '📨', label: 'Bulk contact', desc: 'Message up to 10 seekers at once' },
              { icon: '⚡', label: '"Hiring Now" spotlight', desc: 'Your posts featured on the browse page' },
              { icon: '📊', label: 'Hiring analytics', desc: 'Track views, responses, and hiring funnel' },
              { icon: '🚩', label: 'Submit reports', desc: 'Flag seekers who violate platform rules' },
              { icon: '📥', label: 'Export to CSV', desc: 'Download talent lists for your records' },
            ].map((perk) => (
              <div key={perk.label} className="flex items-start gap-3 p-3 rounded-lg bg-brand-bg border border-brand-border">
                <span className="text-lg flex-shrink-0">{perk.icon}</span>
                <div>
                  <div className="text-sm font-medium text-brand-text">{perk.label}</div>
                  <div className="text-xs text-brand-muted">{perk.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon / Future Upsell Space */}
        <div className="card p-6 border-brand-purple/20 bg-brand-purple/5 mb-8">
          <h2 className="text-lg font-bold text-brand-text mb-2 flex items-center gap-2">
            <span>🚀</span> Coming Soon for Partners
          </h2>
          <p className="text-sm text-brand-muted mb-4">Exclusive features rolling out for Verified Partners:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg/50 border border-brand-border/50">
              <span className="text-lg">🏆</span>
              <div>
                <div className="text-sm font-medium text-brand-text">Employer Achievements</div>
                <div className="text-xs text-brand-muted">Earn badges like &ldquo;Top Employer&rdquo; and &ldquo;Fast Responder&rdquo;</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg/50 border border-brand-border/50">
              <span className="text-lg">📱</span>
              <div>
                <div className="text-sm font-medium text-brand-text">Mobile App</div>
                <div className="text-xs text-brand-muted">Push notifications when talent matches your needs</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg/50 border border-brand-border/50">
              <span className="text-lg">🎯</span>
              <div>
                <div className="text-sm font-medium text-brand-text">Boosted Job Posts</div>
                <div className="text-xs text-brand-muted">Pay to pin your post at the top of search results</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg/50 border border-brand-border/50">
              <span className="text-lg">🤖</span>
              <div>
                <div className="text-sm font-medium text-brand-text">AI Talent Match</div>
                <div className="text-xs text-brand-muted">Auto-matched candidates based on your hiring patterns</div>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Subscription — small, tucked at the bottom */}
        <div className="text-center">
          <button
            onClick={handleManage}
            disabled={loading}
            className="text-sm text-brand-muted hover:text-brand-text transition-colors underline underline-offset-4"
          >
            {loading ? 'Loading...' : 'Manage subscription'}
          </button>
        </div>
      </div>
    )
  }

  // ─── SALES PAGE VIEW (non-partners) ────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-purple-300 text-sm font-medium mb-6">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Verified Partner
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-text mb-4">
          Hire{' '}
          <span className="gradient-text">Without Limits</span>
        </h1>
        <p className="text-lg sm:text-xl text-brand-muted max-w-2xl mx-auto">
          Unlimited contacts. Unlimited job posts. Verified badge that gets responses.
        </p>

        {/* Price */}
        <div className="mt-8 inline-flex flex-col items-center">
          <div className="flex items-end gap-1">
            <span className="text-5xl sm:text-7xl font-black gradient-text">$12.99</span>
            <span className="text-xl sm:text-2xl text-brand-muted mb-3">/mo</span>
          </div>
          <p className="text-brand-muted text-sm">Less than a single job board post. Cancel anytime.</p>
        </div>
      </div>

      {/* Free tier usage callout for non-partner employers */}
      {!statusLoading && isEmployer && !isPartner && contactsRemaining !== null && (
        <div className="card p-5 border-amber-500/30 bg-amber-500/5 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-brand-text">Your Free Tier Usage</p>
              <p className="text-xs text-brand-muted mt-1">Resets on the 1st of each month</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className={`text-lg font-bold ${contactsRemaining === 0 ? 'text-red-400' : 'text-brand-text'}`}>
                  {contactsRemaining}/5
                </div>
                <div className="text-xs text-brand-muted">contacts left</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${jobPostsRemaining === 0 ? 'text-red-400' : 'text-brand-text'}`}>
                  {jobPostsRemaining}/2
                </div>
                <div className="text-xs text-brand-muted">job posts left</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {statusLoading ? (
        <div className="flex justify-center mb-10">
          <div className="w-48 h-14 rounded-xl bg-brand-card animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 mb-10">
          {isEmployer ? (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? 'Redirecting to checkout...' : 'Become a Verified Partner — $12.99/mo'}
            </button>
          ) : session ? (
            <div className="card p-6 text-center border-brand-purple/30">
              <p className="text-brand-muted mb-4">Verified Partner is available for employer accounts only.</p>
              <p className="text-brand-text text-sm">
                Looking for seeker premium?{' '}
                <Link href="/premium" className="text-amber-400 hover:underline">Go here</Link>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/register?role=employer"
                className="px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all shadow-lg"
              >
                Create Employer Account to Get Started
              </Link>
              <p className="text-brand-muted text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-brand-purple hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}
          <p className="text-brand-muted text-sm flex items-center gap-2">
            <span>🔒</span>
            Secure payment via Stripe. Cancel anytime from your dashboard.
          </p>
        </div>
      )}

      {/* Value Props Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="card p-5 text-center border-brand-purple/20">
          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-bold text-brand-text mb-1">Unlimited Contacts</h3>
          <p className="text-xs text-brand-muted">Reach out to as many candidates as you need. No monthly cap.</p>
        </div>
        <div className="card p-5 text-center border-brand-purple/20">
          <div className="text-3xl mb-2">🛡️</div>
          <h3 className="font-bold text-brand-text mb-1">Verified Badge</h3>
          <p className="text-xs text-brand-muted">Seekers trust and prioritize verified employers. Get 3x more responses.</p>
        </div>
        <div className="card p-5 text-center border-brand-purple/20">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-bold text-brand-text mb-1">Hiring Analytics</h3>
          <p className="text-xs text-brand-muted">Track who viewed your posts, response rates, and hiring funnel.</p>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="card overflow-hidden mb-8">
        <div className="p-6 border-b border-brand-border">
          <h2 className="text-xl font-bold text-brand-text">Free vs Verified Partner</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="text-left px-4 sm:px-6 py-4 font-medium">Feature</th>
                <th className="text-center px-4 sm:px-6 py-4 font-medium w-24 sm:w-32">Free</th>
                <th className="text-center px-4 sm:px-6 py-4 font-medium w-24 sm:w-32">
                  <span className="inline-flex items-center gap-1 text-purple-300">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Partner
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {features.map((f) => (
                <tr
                  key={f.label}
                  className={`hover:bg-brand-border/20 transition-colors ${
                    f.free === false ? 'bg-brand-purple/5' : ''
                  }`}
                >
                  <td className="px-4 sm:px-6 py-4 text-brand-text font-medium">{f.label}</td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    {f.free === true ? (
                      <span className="text-emerald-400 text-lg">✓</span>
                    ) : f.free === false ? (
                      <span className="text-brand-border text-lg">🔒</span>
                    ) : (
                      <span className="text-brand-muted text-xs font-medium">{f.free}</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    {f.partner === true ? (
                      <span className="text-emerald-400 text-lg">✓</span>
                    ) : (
                      <span className="text-purple-300 text-xs font-bold">{f.partner}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      {!statusLoading && isEmployer && (
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
          >
            {loading ? 'Redirecting...' : 'Become a Verified Partner — $12.99/mo'}
          </button>
          <p className="text-brand-muted text-sm mt-3 flex items-center justify-center gap-2">
            <span>🔒</span>
            Secure payment via Stripe. Cancel anytime from your dashboard.
          </p>
        </div>
      )}
    </div>
  )
}
