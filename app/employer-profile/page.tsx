'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { VerifiedBadge, NewEmployerBadge } from '@/components/ui/VerifiedBadge'
import { VerifiedPartnerBadge } from '@/components/ui/VerifiedPartnerBadge'
import { VFVerifiedBadge } from '@/components/ui/VFVerifiedBadge'
import Link from 'next/link'

interface EmployerProfile {
  id: string
  companyName?: string | null
  website?: string | null
  linkedIn?: string | null
  description?: string | null
  verified: boolean
  verifiedAt?: string | null
  newEmployer: boolean
  verificationTier?: string | null
  industry?: string | null
  companySize?: string | null
  location?: string | null
  foundedYear?: number | null
  techStack?: string | null
  benefits?: string | null
  cultureStatement?: string | null
  videoIntroUrl?: string | null
  createdAt: string
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-Commerce',
  'Marketing & Advertising', 'Real Estate', 'SaaS', 'Agency',
  'Consulting', 'Media & Entertainment', 'Non-Profit', 'Other',
]

const COMPANY_SIZES = [
  '1-5 (Startup)', '6-20 (Small)', '21-50 (Growing)', '51-200 (Mid-size)',
  '201-500 (Large)', '500+ (Enterprise)',
]

export default function EmployerProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = session?.user as { id: string; role: string } | undefined

  const [profile, setProfile] = useState<EmployerProfile | null>(null)
  const [isPartner, setIsPartner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Free fields
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [description, setDescription] = useState('')

  // Partner fields
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [location, setLocation] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [techStack, setTechStack] = useState('')
  const [benefits, setBenefits] = useState('')
  const [cultureStatement, setCultureStatement] = useState('')
  const [videoIntroUrl, setVideoIntroUrl] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'loading') return
    if (user?.role !== 'employer') {
      router.replace('/')
      return
    }

    fetch('/api/employer-profile')
      .then((r) => r.json())
      .then((data) => {
        setIsPartner(data.isPartner ?? false)
        if (data.profile) {
          const p = data.profile
          setProfile(p)
          setCompanyName(p.companyName || '')
          setWebsite(p.website || '')
          setLinkedIn(p.linkedIn || '')
          setDescription(p.description || '')
          setIndustry(p.industry || '')
          setCompanySize(p.companySize || '')
          setLocation(p.location || '')
          setFoundedYear(p.foundedYear?.toString() || '')
          setTechStack(p.techStack || '')
          setBenefits(p.benefits || '')
          setCultureStatement(p.cultureStatement || '')
          setVideoIntroUrl(p.videoIntroUrl || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, user, router])

  const isNewEmployer =
    profile &&
    !profile.verified &&
    Date.now() - new Date(profile.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/employer-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName, website, linkedIn, description,
          ...(isPartner ? {
            industry, companySize, location, foundedYear, techStack,
            benefits, cultureStatement, videoIntroUrl,
          } : {}),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save profile')
      } else {
        setProfile(data.profile)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h1 className="text-3xl font-black text-brand-text">
            Company <span className="gradient-text">Profile</span>
          </h1>
          {profile?.verificationTier === 'vf_verified' && <VFVerifiedBadge size="md" />}
          {isPartner && profile?.verificationTier !== 'vf_verified' && <VerifiedPartnerBadge size="md" />}
        </div>
        <p className="text-brand-muted">
          {isPartner
            ? 'Your full company profile — visible to all seekers with your verified badge.'
            : 'Basic company info visible to seekers. Upgrade for a full profile.'}
        </p>
      </div>

      {/* Status badges */}
      {profile && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {profile.verified ? (
            <VerifiedBadge size="md" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-card border border-brand-border rounded-xl">
              <svg className="w-4 h-4 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-brand-muted">Pending Verification</span>
            </div>
          )}
          {isNewEmployer && <NewEmployerBadge />}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-sm">
            Profile saved successfully!
          </div>
        )}

        {/* ─── FREE TIER FIELDS ─── */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-brand-text mb-4">Basic Info</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Website URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">LinkedIn URL</label>
              <input
                type="url"
                value={linkedIn}
                onChange={(e) => setLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Company Description
                {!isPartner && <span className="text-brand-muted font-normal ml-1">(max 200 characters)</span>}
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (!isPartner && e.target.value.length > 200) return
                  setDescription(e.target.value)
                }}
                placeholder="Tell freelancers about your company..."
                rows={isPartner ? 5 : 3}
                className="input-field resize-none"
              />
              {!isPartner && (
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-xs ${description.length >= 180 ? 'text-amber-400' : 'text-brand-muted'}`}>
                    {description.length}/200
                  </span>
                  <span className="text-xs text-brand-muted">
                    Partners get unlimited description length
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── PARTNER-ONLY FIELDS ─── */}
        {isPartner ? (
          <>
            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-1 flex items-center gap-2">
                <span>🏢</span> Company Details
              </h2>
              <p className="text-xs text-brand-muted mb-4">Partner-exclusive — helps seekers understand your company better</p>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Company Size</label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select size...</option>
                      {COMPANY_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Location / HQ</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="San Francisco, CA / Remote"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Founded Year</label>
                    <input
                      type="number"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value)}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Tech Stack / Tools Used
                  </label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="React, Node.js, AWS, Figma, Slack..."
                    className="input-field"
                  />
                  <p className="text-xs text-brand-muted mt-1">Comma-separated. Helps tech talent find you.</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-brand-text mb-1 flex items-center gap-2">
                <span>✨</span> Culture & Perks
              </h2>
              <p className="text-xs text-brand-muted mb-4">Stand out to top talent with what makes your company great</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">Benefits & Perks</label>
                  <textarea
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="Flexible hours, health insurance, paid time off, equipment stipend, professional development budget..."
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">Culture Statement</label>
                  <textarea
                    value={cultureStatement}
                    onChange={(e) => setCultureStatement(e.target.value)}
                    placeholder="What's it like to work at your company? What do you value in your team?"
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Company Intro Video
                  </label>
                  <input
                    type="url"
                    value={videoIntroUrl}
                    onChange={(e) => setVideoIntroUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="input-field"
                  />
                  <p className="text-xs text-brand-muted mt-1">YouTube or Vimeo link to introduce your team</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Partner upsell card for free employers */
          <div className="card p-6 border-brand-purple/20 bg-brand-purple/5">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">🔒</div>
              <div className="flex-1">
                <h3 className="font-bold text-brand-text mb-1">Unlock Your Full Company Profile</h3>
                <p className="text-sm text-brand-muted mb-3">
                  Verified Partners get additional profile sections that help attract top talent:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {[
                    'Industry & Company Size',
                    'Location / HQ',
                    'Founded Year',
                    'Tech Stack & Tools',
                    'Benefits & Perks',
                    'Culture Statement',
                    'Company Intro Video',
                    'Unlimited Description Length',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-purple-400 text-xs">🛡️</span>
                      <span className="text-brand-muted">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/verified-partner"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all"
                >
                  Upgrade to Verified Partner — $12.99/mo
                </Link>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
