'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

export function CcpaModal() {
  const [visible, setVisible] = useState(false)
  const [type, setType] = useState<'sell' | 'sensitive'>('sell')

  const openModal = useCallback((modalType: string) => {
    setType(modalType === 'sensitive' ? 'sensitive' : 'sell')
    setVisible(true)
  }, [])

  useEffect(() => {
    // Expose the open function globally for footer buttons
    (window as Window & { __vfCcpaModal?: (type: string) => void }).__vfCcpaModal = openModal
    return () => {
      delete (window as Window & { __vfCcpaModal?: (type: string) => void }).__vfCcpaModal
    }
  }, [openModal])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />

      {/* Modal */}
      <div className="relative card p-8 max-w-lg w-full shadow-2xl">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {type === 'sell' ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-brand-text">
              We Do Not Sell or Share Personal Information
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Virtual Freaks does not sell, rent, or share your personal information with third parties
              for advertising, marketing, or any other commercial purpose. We do not engage in
              cross-context behavioral advertising.
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              Your data is only used to provide and improve the Virtual Freaks service.
            </p>
            <Link
              href="/privacy"
              className="inline-block text-sm text-brand-purple hover:text-purple-400 transition-colors underline"
            >
              See our Privacy Policy for more information
            </Link>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-brand-text">
              We Do Not Collect Sensitive Personal Information
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Virtual Freaks does not collect or process sensitive personal information as defined by
              the California Consumer Privacy Act (CCPA). We do not collect data related to race, ethnicity,
              religion, health, sexual orientation, genetic data, biometric data, or precise geolocation.
            </p>
            <p className="text-sm text-brand-muted leading-relaxed">
              The only personal information we collect is what you voluntarily provide when creating
              your account and profile (name, email, skills, portfolio).
            </p>
            <Link
              href="/privacy"
              className="inline-block text-sm text-brand-purple hover:text-purple-400 transition-colors underline"
            >
              See our Privacy Policy for more information
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
