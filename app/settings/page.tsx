'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface NotificationPreferences {
  contact_request: boolean
  profile_view: boolean
  message: boolean
  system: boolean
}

const PREF_LABELS: { key: keyof NotificationPreferences; label: string; description: string; alwaysOn?: boolean }[] = [
  { key: 'contact_request', label: 'Contact Requests', description: 'Get notified when someone sends you a contact request' },
  { key: 'profile_view', label: 'Profile Views', description: 'Get notified when an employer views your profile' },
  { key: 'message', label: 'Messages', description: 'Get notified when you receive a new message' },
  { key: 'system', label: 'System Notifications', description: 'Important system updates and announcements', alwaysOn: true },
]

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/notification-preferences')
        .then((r) => r.json())
        .then((data) => {
          if (data.preferences) setPrefs(data.preferences)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [session])

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (key === 'system' || !prefs) return
    const newValue = !prefs[key]
    const updated = { ...prefs, [key]: newValue }
    setPrefs(updated)
    setSaving(true)
    try {
      await fetch('/api/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      })
    } catch {
      // Revert on error
      setPrefs(prefs)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin mx-auto" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-black text-brand-text mb-8">
        <span className="gradient-text">Settings</span>
      </h1>

      {/* Notification Preferences */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-brand-text mb-1">Notification Preferences</h2>
        <p className="text-sm text-brand-muted mb-6">Choose which notifications you want to receive.</p>

        <div className="space-y-4">
          {PREF_LABELS.map(({ key, label, description, alwaysOn }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-brand-border last:border-b-0"
            >
              <div className="pr-4">
                <p className="text-sm font-medium text-brand-text">{label}</p>
                <p className="text-xs text-brand-muted mt-0.5">{description}</p>
              </div>
              <button
                onClick={() => handleToggle(key)}
                disabled={alwaysOn || saving}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  alwaysOn
                    ? 'bg-brand-purple/50 cursor-not-allowed'
                    : prefs?.[key]
                    ? 'bg-brand-purple'
                    : 'bg-brand-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    prefs?.[key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {saving && (
          <p className="text-xs text-brand-muted mt-4">Saving...</p>
        )}
      </div>
    </div>
  )
}
