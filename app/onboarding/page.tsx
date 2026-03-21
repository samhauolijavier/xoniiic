'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelect = async (role: 'seeker' | 'employer') => {
    setLoading(role)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        setLoading(null)
        return
      }

      // Refresh the session so role is updated
      await update()

      if (role === 'seeker') {
        router.push('/profile/edit')
      } else {
        router.push('/browse')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-black">
              VF
            </div>
            <span className="font-black text-2xl gradient-text">Virtual Freaks</span>
          </Link>
          <h1 className="text-3xl font-black text-brand-text mt-4">
            Welcome! How will you use <span className="gradient-text">Virtual Freaks</span>?
          </h1>
          <p className="text-brand-muted mt-2">Choose your role to get started. You can always change this later.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Seeker Card */}
          <button
            onClick={() => handleSelect('seeker')}
            disabled={loading !== null}
            className="card p-8 text-left hover:border-brand-purple transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
              👤
            </div>
            <h2 className="text-xl font-bold text-brand-text mb-2">
              {loading === 'seeker' ? 'Setting up...' : "I'm looking for work"}
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Create a freelancer profile, showcase your skills, set your rate, and get discovered by employers worldwide.
            </p>
            <div className="mt-5 flex items-center gap-2 text-brand-purple font-semibold text-sm">
              {loading === 'seeker' ? (
                <><span className="spinner w-4 h-4" /> Setting up your profile...</>
              ) : (
                <>Get started as Talent <span className="group-hover:translate-x-1 transition-transform inline-block">→</span></>
              )}
            </div>
          </button>

          {/* Employer Card */}
          <button
            onClick={() => handleSelect('employer')}
            disabled={loading !== null}
            className="card p-8 text-left hover:border-brand-orange transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-orange to-orange-700 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
              🏢
            </div>
            <h2 className="text-xl font-bold text-brand-text mb-2">
              {loading === 'employer' ? 'Setting up...' : "I'm hiring"}
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Browse skilled remote talent, contact freelancers, save profiles, and post your hiring needs — always free.
            </p>
            <div className="mt-5 flex items-center gap-2 text-brand-orange font-semibold text-sm">
              {loading === 'employer' ? (
                <><span className="spinner w-4 h-4" /> Setting up your account...</>
              ) : (
                <>Start hiring <span className="group-hover:translate-x-1 transition-transform inline-block">→</span></>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
