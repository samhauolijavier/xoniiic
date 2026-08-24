'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      const data = await res.json()

      // Nothing is branched on any more. The server answers identically for
      // every address, so this page cannot reveal what the server will not.
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-purple flex items-center justify-center text-white font-black">
              VF
            </div>
            <span className="font-black text-2xl gradient-text">Virtual Freaks</span>
          </Link>
          <h1 className="text-2xl font-bold text-brand-text">Reset your password</h1>
          <p className="text-brand-muted mt-1">
            {submitted
              ? 'Your reset link is ready'
              : "Enter your email and we'll generate a reset link"}
          </p>
        </div>

        <div className="card p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              {/* One message, whatever happened. Rendering the link here was
                  handing a reset URL to whoever typed the address — the whole
                  hole this closed. */}
              <p className="text-brand-text font-medium">Check your email</p>
              <p className="text-sm text-brand-muted">
                If an account exists for <span className="text-brand-text">{email}</span>, a reset
                link is on its way. It works once and expires in an hour.
              </p>
              <p className="text-xs text-brand-muted">
                Nothing arrived? Check spam, and make sure that is the address you signed up with.
              </p>

              <Link
                href="/login"
                className="inline-block mt-2 text-sm text-brand-purple hover:text-purple-400 transition-colors"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="input-field"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading ? (
                    <><span className="spinner w-4 h-4" /> Generating...</>
                  ) : (
                    'Get Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-brand-border text-center">
                <Link href="/login" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
