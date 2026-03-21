'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface ContactModalProps {
  profileId: string
  profileName: string
}

export function ContactModal({ profileId, profileName }: ContactModalProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [senderEmail, setSenderEmail] = useState((session?.user as { email?: string })?.email || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: profileId, message, senderEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send message')
      } else {
        setSuccess(true)
        setMessage('')
        setTimeout(() => { setOpen(false); setSuccess(false) }, 2000)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary w-full justify-center text-sm">
        Contact {profileName.split(' ')[0]}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative card p-6 w-full max-w-md z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-brand-text">Contact {profileName}</h3>
              <button onClick={() => setOpen(false)} className="text-brand-muted hover:text-brand-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-brand-text font-medium">Message sent!</p>
                <p className="text-brand-muted text-sm mt-1">Your contact request has been sent.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Safety Warning */}
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 text-sm text-yellow-200/80">
                  <p className="font-semibold text-yellow-300/90 mb-2">⚠️ Stay Safe on Virtual Freaks</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Never pay for equipment, software, or training upfront</li>
                    <li>• Never share your full ID before signing a contract</li>
                    <li>• Always agree on payment terms in writing before starting</li>
                    <li>• Report suspicious employers using the 🚩 Report button</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi ${profileName.split(' ')[0]}, I came across your profile on Virtual Freaks and I'm interested in working with you...`}
                    required
                    rows={5}
                    minLength={20}
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-brand-muted mt-1">{message.length} characters (min 20)</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="btn-secondary flex-1 justify-center text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || message.length < 20}
                    className="btn-primary flex-1 justify-center text-sm"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
