'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'


type Role = 'seeker' | 'employer'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as Role) || 'seeker'
  const redirectUrl = searchParams.get('redirect') || null

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole as Role,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Email verification hibernated — skip straight to sign in
      // When ready to enable: uncomment the block below
      // if (data.requiresVerification) {
      //   router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      //   return
      // }

      // Auto sign in
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        if (redirectUrl) {
          router.push(redirectUrl)
        } else {
          router.push(formData.role === 'seeker' ? '/profile/edit' : '/browse')
        }
      } else {
        router.push('/login')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 hero-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-black">
              VF
            </div>
            <span className="font-black text-2xl gradient-text">Virtual Freaks</span>
          </Link>
          <h1 className="text-2xl font-bold text-brand-text">Create your account</h1>
          <p className="text-brand-muted mt-1">
            {redirectUrl === '/browse'
              ? 'Create a free account to browse talent'
              : 'Join the remote talent marketplace'}
          </p>
        </div>

        <div className="card p-8">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: redirectUrl || '/onboarding' })}
            className="w-full flex items-center justify-center gap-3 bg-brand-card border border-brand-border hover:border-brand-purple text-brand-text font-medium py-3 px-4 rounded-xl transition-all mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-brand-card px-3 text-brand-muted">or register with email</span>
            </div>
          </div>

          {/* Role Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-brand-border mb-6">
            {(['seeker', 'employer'] as Role[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  formData.role === role
                    ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
                    : 'bg-transparent text-brand-muted hover:text-brand-text'
                }`}
              >
                {role === 'seeker' ? '👤 I am a Freelancer' : '🏢 I am Hiring'}
              </button>
            ))}
          </div>

          {formData.role === 'employer' && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 text-sm">
              ✓ Employer accounts are 100% free — no subscription needed
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                required
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? (
                <><span className="spinner w-4 h-4" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-xs text-brand-muted text-center mt-4">
            By registering you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="mt-6 pt-6 border-t border-brand-border text-center">
            <p className="text-sm text-brand-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-purple hover:text-purple-400 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
