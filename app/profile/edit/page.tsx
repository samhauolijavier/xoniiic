'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { SkillEditor } from '@/components/seeker/SkillEditor'
import { getCompletionScore } from '@/lib/completionScore'
import { ShareProfileLink } from '@/components/seeker/ShareProfileLink'
import { FoundingMemberBadge } from '@/components/ui/FoundingMemberBadge'

interface SelectedSkill {
  skillId: string
  name: string
  category: string
  rating: number
  yearsExp: number | null
}

interface ProfileData {
  bio: string
  location: string
  hourlyRate: string
  rateType: string
  availability: string
  englishRating: number
  avatarUrl: string | null
  username: string
  name: string
  title: string
  videoIntroUrl: string
  timezone: string
}

interface PortfolioLink {
  label: string
  url: string
}

interface Language {
  name: string
  level: string
}

interface Certificate {
  id: string
  name: string
  issuer: string
  year: number | null
  imageUrl: string | null
}

interface ProjectImage {
  id: string
  title: string
  description: string | null
  imageUrl: string
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Lima',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Karachi',
  'Asia/Manila',
  'Asia/Jakarta',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const LANGUAGE_LEVELS = ['basic', 'conversational', 'fluent', 'native']

type ActiveTab = 'profile' | 'skills' | 'portfolio' | 'projects' | 'certificates'

export default function ProfileEditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const certImageRef = useRef<HTMLInputElement>(null)
  const projectImageRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    bio: '',
    location: '',
    hourlyRate: '',
    rateType: 'hourly',
    availability: 'open',
    englishRating: 5,
    avatarUrl: null,
    username: '',
    name: '',
    title: '',
    videoIntroUrl: '',
    timezone: '',
  })
  const [skills, setSkills] = useState<SelectedSkill[]>([])
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [projects, setProjects] = useState<ProjectImage[]>([])

  // New cert/project form state
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '', imageUrl: '' })
  const [newProject, setNewProject] = useState({ title: '', description: '', imageUrl: '' })

  const [foundingMemberNumber, setFoundingMemberNumber] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const tabParam = searchParams.get('tab') as ActiveTab | null
  const validTabs: ActiveTab[] = ['profile', 'skills', 'portfolio', 'projects', 'certificates']
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'profile'
  )

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    const user = session?.user as { role?: string } | undefined
    if (user && user.role !== 'seeker') {
      router.push('/dashboard')
      return
    }
  }, [status, session, router])

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          const p = data.profile
          setProfileData({
            bio: p.bio || '',
            location: p.location || '',
            hourlyRate: p.hourlyRate?.toString() || '',
            rateType: p.rateType || 'hourly',
            availability: p.availability || 'open',
            englishRating: p.englishRating || 5,
            avatarUrl: p.avatarUrl,
            username: p.username,
            name: p.user.name || '',
            title: p.title || '',
            videoIntroUrl: p.videoIntroUrl || '',
            timezone: p.timezone || '',
          })
          setSkills(
            p.skills.map((s: { skillId?: string; skill?: { id: string; name: string; category: string }; rating: number; yearsExp: number | null }) => ({
              skillId: s.skillId || s.skill?.id || '',
              name: s.skill?.name || '',
              category: s.skill?.category || '',
              rating: s.rating,
              yearsExp: s.yearsExp,
            }))
          )
          setPortfolioLinks(p.portfolioLinks || [])
          setLanguages(p.languages || [])
          setCertificates(p.certificates || [])
          setProjects(p.projectImages || [])
          if (data.foundingMemberNumber !== undefined) {
            setFoundingMemberNumber(data.foundingMemberNumber)
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setLoading(false)
      }
    }
    if (status === 'authenticated') loadProfile()
  }, [status])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setProfileData(prev => ({ ...prev, avatarUrl: data.avatarUrl }))
        setMessage({ type: 'success', text: 'Avatar updated!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          bio: profileData.bio,
          location: profileData.location,
          hourlyRate: profileData.hourlyRate || null,
          rateType: profileData.rateType,
          availability: profileData.availability,
          englishRating: profileData.englishRating,
          title: profileData.title,
          videoIntroUrl: profileData.videoIntroUrl,
          timezone: profileData.timezone,
          languages,
        }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile saved successfully!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Save failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSkills = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Skills saved successfully!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Save failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePortfolio = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioLinks }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Portfolio links saved!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Save failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleCertImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 500KB' })
      return
    }
    const base64 = await fileToBase64(file)
    setNewCert(prev => ({ ...prev, imageUrl: base64 }))
  }

  const handleProjectImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 500KB' })
      return
    }
    const base64 = await fileToBase64(file)
    setNewProject(prev => ({ ...prev, imageUrl: base64 }))
  }

  const handleAddCertificate = async () => {
    if (!newCert.name || !newCert.issuer) {
      setMessage({ type: 'error', text: 'Certificate name and issuer are required' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCert.name,
          issuer: newCert.issuer,
          year: newCert.year || null,
          imageUrl: newCert.imageUrl || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCertificates(prev => [...prev, data.certificate])
        setNewCert({ name: '', issuer: '', year: '', imageUrl: '' })
        setMessage({ type: 'success', text: 'Certificate added!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add certificate' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add certificate' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCertificate = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/certificates?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCertificates(prev => prev.filter(c => c.id !== id))
        setMessage({ type: 'success', text: 'Certificate removed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove certificate' })
    }
  }

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.imageUrl) {
      setMessage({ type: 'error', text: 'Project title and image are required' })
      return
    }
    if (projects.length >= 8) {
      setMessage({ type: 'error', text: 'Maximum 8 projects allowed' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description || null,
          imageUrl: newProject.imageUrl,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setProjects(prev => [...prev, data.project])
        setNewProject({ title: '', description: '', imageUrl: '' })
        setMessage({ type: 'success', text: 'Project added!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add project' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add project' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/projects?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id))
        setMessage({ type: 'success', text: 'Project removed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove project' })
    }
  }

  const addPortfolioLink = () => {
    if (portfolioLinks.length >= 6) return
    setPortfolioLinks(prev => [...prev, { label: '', url: '' }])
  }

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(prev => prev.filter((_, i) => i !== index))
  }

  const updatePortfolioLink = (index: number, field: 'label' | 'url', value: string) => {
    setPortfolioLinks(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  const addLanguage = () => {
    setLanguages(prev => [...prev, { name: '', level: 'conversational' }])
  }

  const removeLanguage = (index: number) => {
    setLanguages(prev => prev.filter((_, i) => i !== index))
  }

  const updateLanguage = (index: number, field: 'name' | 'level', value: string) => {
    setLanguages(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'profile', label: '👤 Profile' },
    { key: 'skills', label: '⚡ Skills' },
    { key: 'portfolio', label: '🔗 Portfolio' },
    { key: 'projects', label: '🖼️ Projects' },
    { key: 'certificates', label: '📜 Certificates' },
  ]

  const completionData = getCompletionScore({
    avatarUrl: profileData.avatarUrl,
    bio: profileData.bio,
    title: profileData.title,
    hourlyRate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : null,
    englishRating: profileData.englishRating,
    location: profileData.location,
    videoIntroUrl: profileData.videoIntroUrl,
    timezone: profileData.timezone,
    skills: skills.map(s => ({ id: s.skillId })),
    portfolioLinks: portfolioLinks.filter(l => l.url).map((_, i) => ({ id: String(i) })),
    certificates: certificates.map(c => ({ id: c.id })),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
              Edit <span className="gradient-text">Profile</span>
            </h1>
            {foundingMemberNumber && (
              <FoundingMemberBadge number={foundingMemberNumber} size="md" />
            )}
          </div>
          <p className="text-brand-muted mt-1">Keep your profile up to date to attract employers</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
          completionData.color === 'green'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : completionData.color === 'orange'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
            style={{ borderColor: 'currentColor' }}
          >
            {completionData.score}
          </div>
          Profile {completionData.score}% complete
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm border ${
          message.type === 'success'
            ? 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400'
            : 'bg-red-900/30 border-red-700/40 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Link */}
      {profileData.username && (
        <div className="mb-6">
          <ShareProfileLink username={profileData.username} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap rounded-xl overflow-hidden border border-brand-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setMessage(null) }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all min-w-[80px] ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
                : 'bg-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Profile ─── */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Profile Picture</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                {profileData.avatarUrl ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden avatar-ring">
                    <Image src={profileData.avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-black text-xl">
                    {profileData.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary text-sm">
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                <p className="text-xs text-brand-muted mt-1">JPEG, PNG or WebP. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-brand-text">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Full Name</label>
              <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} placeholder="Your full name" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Professional Title / Headline</label>
              <input
                type="text"
                value={profileData.title}
                onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                placeholder="e.g. Full Stack Developer, Virtual Assistant, Graphic Designer"
                className="input-field"
                maxLength={100}
              />
              <p className="text-xs text-brand-muted mt-1">A short headline shown on your public profile and search results</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm">@</span>
                <input type="text" value={profileData.username} readOnly className="input-field pl-8 opacity-60 cursor-not-allowed" />
              </div>
              <p className="text-xs text-brand-muted mt-1">Username cannot be changed after registration</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell employers about yourself, your experience, and what makes you unique..."
                rows={4}
                className="input-field resize-none"
                maxLength={500}
              />
              <p className="text-xs text-brand-muted mt-1">{profileData.bio.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Location</label>
              <input type="text" value={profileData.location} onChange={(e) => setProfileData({ ...profileData, location: e.target.value })} placeholder="e.g. Philippines, Colombia, India" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Timezone</label>
              <select value={profileData.timezone} onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })} className="input-field">
                <option value="">-- Select your timezone --</option>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Video Intro URL</label>
              <input
                type="url"
                value={profileData.videoIntroUrl}
                onChange={(e) => setProfileData({ ...profileData, videoIntroUrl: e.target.value })}
                placeholder="Paste a video link (YouTube, Vimeo, Loom, etc.)"
                className="input-field"
              />
            </div>
          </div>

          {/* Work Preferences */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-brand-text">Work Preferences</h2>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Rate (USD)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm">$</span>
                  <input type="number" value={profileData.hourlyRate} onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })} placeholder={profileData.rateType === 'hourly' ? '25' : '2000'} min={1} step={0.5} className="input-field pl-7" />
                </div>
                <select
                  value={profileData.rateType}
                  onChange={(e) => setProfileData({ ...profileData, rateType: e.target.value })}
                  className="input-field w-36"
                >
                  <option value="hourly">Per Hour</option>
                  <option value="monthly">Per Month</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Availability</label>
              <select value={profileData.availability} onChange={(e) => setProfileData({ ...profileData, availability: e.target.value })} className="input-field">
                <option value="open">Available Now (Full-time)</option>
                <option value="part-time">Part-time Available</option>
                <option value="unavailable">Not Available</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">English Proficiency: {profileData.englishRating}/10</label>
              <input type="range" min={1} max={10} value={profileData.englishRating} onChange={(e) => setProfileData({ ...profileData, englishRating: parseInt(e.target.value) })} className="w-full accent-brand-purple" />
              <div className="flex justify-between text-xs text-brand-muted mt-1">
                <span>Basic (1)</span>
                <span>Native (10)</span>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-text">Other Languages Spoken</h2>
              <button onClick={addLanguage} className="btn-secondary text-sm py-1.5 px-3">+ Add Language</button>
            </div>
            <p className="text-xs text-brand-muted mb-4">Add languages beyond English. English proficiency is set above.</p>

            {languages.length === 0 ? (
              <p className="text-sm text-brand-muted text-center py-4">No additional languages added yet</p>
            ) : (
              <div className="space-y-3">
                {languages.map((lang, i) => (
                  <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                    <input
                      type="text"
                      value={lang.name}
                      onChange={(e) => updateLanguage(i, 'name', e.target.value)}
                      placeholder="e.g. Spanish, Tagalog, Portuguese"
                      className="input-field flex-1 min-w-0"
                    />
                    <select
                      value={lang.level}
                      onChange={(e) => updateLanguage(i, 'level', e.target.value)}
                      className="input-field w-full sm:w-40"
                    >
                      {LANGUAGE_LEVELS.map(l => (
                        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeLanguage(i)}
                      className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 text-lg leading-none"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-between items-center">
            {profileData.username && (
              <a href={`/talent/${profileData.username}`} className="btn-secondary text-sm" target="_blank">
                View Public Profile
              </a>
            )}
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary ml-auto">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB: Skills ─── */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Your Skills</h2>
            <SkillEditor initialSkills={skills} onChange={setSkills} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveSkills} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Skills'}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB: Portfolio ─── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-text">Portfolio Links</h2>
              {portfolioLinks.length < 6 && (
                <button onClick={addPortfolioLink} className="btn-secondary text-sm py-1.5 px-3">+ Add Link</button>
              )}
            </div>
            <p className="text-sm text-brand-muted mb-5">Add up to 6 links to your work — GitHub, Behance, personal site, etc.</p>

            {portfolioLinks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-muted mb-3">No portfolio links yet</p>
                <button onClick={addPortfolioLink} className="btn-secondary text-sm">Add Your First Link</button>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolioLinks.map((link, i) => (
                  <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updatePortfolioLink(i, 'label', e.target.value)}
                      placeholder="Label (e.g. GitHub, Behance)"
                      className="input-field w-full sm:w-40 sm:flex-shrink-0"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)}
                      placeholder="https://..."
                      className="input-field flex-1 min-w-0"
                    />
                    <button
                      onClick={() => removePortfolioLink(i)}
                      className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 text-lg leading-none"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <p className="text-xs text-brand-muted">{portfolioLinks.length}/6 links</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={handleSavePortfolio} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Portfolio Links'}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB: Projects ─── */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Add New Project */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Add Project</h2>
            <p className="text-xs text-brand-muted mb-4">
              Showcase your work with images. Keep images under 500KB. Max 8 projects.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">Project Title *</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. E-commerce Website for XYZ Brand"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">Description (optional)</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the project..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">Project Image * (max 500KB)</label>
                <input type="file" ref={projectImageRef} onChange={handleProjectImageChange} accept="image/*" className="hidden" />
                {newProject.imageUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-brand-border flex-shrink-0">
                      <img src={newProject.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => setNewProject(prev => ({ ...prev, imageUrl: '' }))} className="text-red-400 text-sm hover:text-red-300">
                      Remove image
                    </button>
                  </div>
                ) : (
                  <button onClick={() => projectImageRef.current?.click()} className="btn-secondary text-sm">
                    Choose Image
                  </button>
                )}
              </div>

              <button
                onClick={handleAddProject}
                disabled={saving || projects.length >= 8}
                className="btn-primary w-full justify-center"
              >
                {saving ? 'Adding...' : 'Add Project'}
              </button>
            </div>
          </div>

          {/* Existing Projects */}
          {projects.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-4">Your Projects ({projects.length}/8)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-brand-border/30 rounded-xl overflow-hidden border border-brand-border">
                    <div className="aspect-video relative">
                      <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-brand-text text-sm truncate">{project.title}</p>
                      {project.description && (
                        <p className="text-xs text-brand-muted mt-1 line-clamp-2">{project.description}</p>
                      )}
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-400 text-xs hover:text-red-300 mt-2 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Certificates ─── */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Add Certificate */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Add Certificate</h2>
            <p className="text-xs text-brand-muted mb-4">
              Add professional certifications and courses. Certificate images must be under 500KB.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">Certificate Name *</label>
                <input
                  type="text"
                  value={newCert.name}
                  onChange={(e) => setNewCert(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. AWS Certified Developer, Google Analytics Certificate"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">Issuing Organization *</label>
                <input
                  type="text"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert(prev => ({ ...prev, issuer: e.target.value }))}
                  placeholder="e.g. Amazon Web Services, Google, Coursera"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">Year (optional)</label>
                <input
                  type="number"
                  value={newCert.year}
                  onChange={(e) => setNewCert(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="e.g. 2024"
                  min={1990}
                  max={new Date().getFullYear()}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">Certificate Image (optional, max 500KB)</label>
                <input type="file" ref={certImageRef} onChange={handleCertImageChange} accept="image/*" className="hidden" />
                {newCert.imageUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-brand-border flex-shrink-0">
                      <img src={newCert.imageUrl} alt="cert preview" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => setNewCert(prev => ({ ...prev, imageUrl: '' }))} className="text-red-400 text-sm hover:text-red-300">
                      Remove image
                    </button>
                  </div>
                ) : (
                  <button onClick={() => certImageRef.current?.click()} className="btn-secondary text-sm">
                    Choose Image
                  </button>
                )}
              </div>

              <button onClick={handleAddCertificate} disabled={saving} className="btn-primary w-full justify-center">
                {saving ? 'Adding...' : 'Add Certificate'}
              </button>
            </div>
          </div>

          {/* Existing Certificates */}
          {certificates.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-4">Your Certificates</h2>
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-4 bg-brand-border/30 rounded-xl p-4 border border-brand-border">
                    {cert.imageUrl && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-brand-border flex-shrink-0">
                        <img src={cert.imageUrl} alt={cert.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-text text-sm">{cert.name}</p>
                      <p className="text-xs text-brand-muted">{cert.issuer}{cert.year ? ` • ${cert.year}` : ''}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCertificate(cert.id)}
                      className="text-red-400 text-sm hover:text-red-300 flex-shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
