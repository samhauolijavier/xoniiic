'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Missing reset token. Please use the link from your email.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-black">
              VF
            </div>
            <span className="font-black text-2xl gradient-text">Virtual Freaks</span>
          </Link>
          <h1 className="text-2xl font-bold text-brand-text">Set new password</h1>
          <p className="text-brand-muted mt-1">Choose a strong password for your account</p>
        </div>

        <div className="card p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-brand-text font-medium">Password updated!</p>
              <p className="text-sm text-brand-muted">Redirecting to login...</p>
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
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="input-field"
                    disabled={!token}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="input-field"
                    disabled={!token}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading ? (
                    <><span className="spinner w-4 h-4" /> Updating...</>
                  ) : (
                    'Update Password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center hero-bg">
        <div className="spinner" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
