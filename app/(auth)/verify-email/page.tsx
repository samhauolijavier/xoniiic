'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Start 60s cooldown on mount (code was just sent during registration)
  useEffect(() => {
    setResendCooldown(60)
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('')
      digits.forEach((d, i) => {
        if (i + index < 6) newCode[i + index] = d
      })
      setCode(newCode)
      const nextIdx = Math.min(index + digits.length, 5)
      inputRefs.current[nextIdx]?.focus()
      return
    }

    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length > 0) {
      const newCode = [...code]
      pastedData.split('').forEach((d, i) => {
        if (i < 6) newCode[i] = d
      })
      setCode(newCode)
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  const handleVerify = useCallback(async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }, [code, email, router])

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.every(d => d !== '') && !loading && !success) {
      handleVerify()
    }
  }, [code, loading, success, handleVerify])

  const handleResend = async () => {
    if (resendCooldown > 0) return

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setError(data.error)
        return
      }

      setResendCooldown(60)
      setError('')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to resend code')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 hero-bg">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <div className="text-6xl mb-4">&#10003;</div>
            <h2 className="text-2xl font-black gradient-text mb-2">Email Verified!</h2>
            <p className="text-brand-muted">Redirecting you to sign in...</p>
            <div className="mt-4 w-12 h-1 mx-auto rounded-full bg-gradient-to-r from-brand-purple to-brand-orange animate-pulse" />
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-brand-text">Verify your email</h1>
          <p className="text-brand-muted mt-1">
            We sent a 6-digit code to{' '}
            <span className="text-brand-text font-medium">{email}</span>
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 6 digit inputs */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl bg-brand-bg border border-brand-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-brand-text outline-none transition-all"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || code.some(d => d === '')}
            className="btn-primary w-full justify-center py-3 text-base mb-4"
          >
            {loading ? (
              <><span className="spinner w-4 h-4" /> Verifying...</>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`text-sm font-medium transition-colors ${
                resendCooldown > 0
                  ? 'text-brand-muted cursor-not-allowed'
                  : 'text-brand-purple hover:text-purple-400'
              }`}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend code'}
            </button>
          </div>

          <p className="text-xs text-brand-muted text-center mt-4">
            Didn&apos;t receive a code? Check your spam folder or contact support.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-brand-muted hover:text-brand-purple transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
