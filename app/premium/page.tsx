'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const features = [
  { label: 'Create profile', free: true, premium: true },
  { label: 'Browse opportunities', free: true, premium: true },
  { label: 'Profile views count', free: true, premium: true },
  { label: 'WHO viewed your profile', free: false, premium: true },
  { label: 'Full analytics dashboard', free: false, premium: true },
  { label: 'Premium badge on profile', free: false, premium: true },
  { label: 'Priority in search results', free: false, premium: true },
]

export default function PremiumPage() {
  const { data: session } = useSession()
  const user = session?.user as { id: string; role: string } | undefined

  const [isPremium, setIsPremium] = useState(false)
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null)
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
    if (!session) {
      setStatusLoading(false)
      return
    }
    fetch('/api/premium/status')
      .then((r) => r.json())
      .then((data) => {
        setIsPremium(data.premium ?? false)
        setPremiumUntil(data.premiumUntil ?? null)
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false))
  }, [session])

  const handleUpgrade = async () => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/premium/checkout', { method: 'POST' })
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

  const isSeeker = user?.role === 'seeker'

  if (!monetizationLoading && !monetizationEnabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-6xl mb-6">🚀</div>
          <h1 className="text-3xl sm:text-5xl font-black text-brand-text mb-4">
            <span className="gradient-text">Premium</span> is Coming Soon!
          </h1>
          <p className="text-lg text-brand-muted max-w-xl mx-auto mb-8">
            Premium subscriptions are coming soon! Stay tuned.
          </p>
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
          <span>★</span> Premium Membership
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-text mb-4">
          Go{' '}
          <span className="gradient-text">Premium</span>
        </h1>
        <p className="text-lg sm:text-xl text-brand-muted max-w-2xl mx-auto">
          Unlock everything. Know who&apos;s looking.
        </p>

        {/* Price */}
        <div className="mt-8 inline-flex flex-col items-center">
          <div className="flex items-end gap-1">
            <span className="text-5xl sm:text-7xl font-black gradient-text">$2.99</span>
            <span className="text-xl sm:text-2xl text-brand-muted mb-3">/mo</span>
          </div>
          <p className="text-brand-muted text-sm">Less than a coffee. Cancel anytime.</p>
        </div>
      </div>

      {/* CTA or Premium Status */}
      {statusLoading ? (
        <div className="flex justify-center mb-10">
          <div className="w-48 h-14 rounded-xl bg-brand-card animate-pulse" />
        </div>
      ) : isPremium ? (
        <div className="card p-8 border-amber-500/30 bg-amber-500/5 text-center mb-10">
          <div className="text-4xl mb-3">★</div>
          <h2 className="text-2xl font-black text-brand-text mb-2">
            You&apos;re <span className="gradient-text">Premium!</span>
          </h2>
          {premiumUntil && (
            <p className="text-brand-muted mb-6">
              Your premium is active until{' '}
              <span className="text-brand-text font-medium">
                {new Date(premiumUntil).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
            <button
              onClick={handleManage}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 mb-10">
          {isSeeker ? (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? 'Redirecting to checkout...' : 'Upgrade to Premium — $2.99/mo'}
            </button>
          ) : session ? (
            <div className="card p-6 text-center border-brand-purple/30">
              <p className="text-brand-muted mb-4">This premium tier is for freelancers.</p>
              <p className="text-brand-text text-sm mb-4">
                Looking for employer features?
              </p>
              <a
                href="/verified-partner"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Become a Verified Partner — $12.99/mo
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/login"
                className="px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:opacity-90 transition-all shadow-lg"
              >
                Sign In to Upgrade — $2.99/mo
              </Link>
              <p className="text-brand-muted text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-brand-purple hover:underline">
                  Register free
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

      {/* Feature Comparison Table */}
      <div className="card overflow-hidden mb-8">
        <div className="p-6 border-b border-brand-border">
          <h2 className="text-xl font-bold text-brand-text">What&apos;s included</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="text-left px-4 sm:px-6 py-4 font-medium">Feature</th>
                <th className="text-center px-4 sm:px-6 py-4 font-medium w-20 sm:w-28">Free</th>
                <th className="text-center px-4 sm:px-6 py-4 font-medium w-20 sm:w-28">
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <span>★</span> Premium
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {features.map((f) => (
                <tr
                  key={f.label}
                  className={`hover:bg-brand-border/20 transition-colors ${!f.free && f.premium ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="px-4 sm:px-6 py-4 text-brand-text font-medium">{f.label}</td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    {f.free ? (
                      <span className="text-emerald-400 text-lg">✓</span>
                    ) : (
                      <span className="text-brand-border text-lg">🔒</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    {f.premium ? (
                      <span className="text-emerald-400 text-lg">✓</span>
                    ) : (
                      <span className="text-brand-border">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      {!isPremium && !statusLoading && isSeeker && (
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
          >
            {loading ? 'Redirecting...' : 'Get Premium Now — $2.99/mo'}
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
