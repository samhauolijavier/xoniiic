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
  openToWork: boolean
  englishRating: number
  avatarUrl: string | null
  username: string
  name: string
  title: string
  videoIntroUrl: string
  timezone: string
  linkedinUrl: string
  githubUrl: string
  twitterUrl: string
  facebookUrl: string
  instagramUrl: string
  portfolioUrl: string
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
    openToWork: true,
    englishRating: 5,
    avatarUrl: null,
    username: '',
    name: '',
    title: '',
    videoIntroUrl: '',
    timezone: '',
    linkedinUrl: '',
    githubUrl: '',
    twitterUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    portfolioUrl: '',
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
            openToWork: p.openToWork !== false,
            englishRating: p.englishRating || 5,
            avatarUrl: p.avatarUrl,
            username: p.username,
            name: p.user.name || '',
            title: p.title || '',
            videoIntroUrl: p.videoIntroUrl || '',
            timezone: p.timezone || '',
            linkedinUrl: p.linkedinUrl || '',
            githubUrl: p.githubUrl || '',
            twitterUrl: p.twitterUrl || '',
            facebookUrl: p.facebookUrl || '',
            instagramUrl: p.instagramUrl || '',
            portfolioUrl: p.portfolioUrl || '',
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
          openToWork: profileData.openToWork,
          englishRating: profileData.englishRating,
          title: profileData.title,
          videoIntroUrl: profileData.videoIntroUrl,
          timezone: profileData.timezone,
          linkedinUrl: profileData.linkedinUrl || null,
          githubUrl: profileData.githubUrl || null,
          twitterUrl: profileData.twitterUrl || null,
          facebookUrl: profileData.facebookUrl || null,
          instagramUrl: profileData.instagramUrl || null,
          portfolioUrl: profileData.portfolioUrl || null,
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

          {/* Open to Work Toggle — saves immediately */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-text">Open to Work</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  {profileData.openToWork
                    ? 'Your profile is visible to employers in browse and search'
                    : 'Your profile is hidden from browse and search. Employers can still view your profile via direct link.'}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const next = !profileData.openToWork
                  setProfileData(prev => ({ ...prev, openToWork: next }))
                  try {
                    const res = await fetch('/api/profile', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ openToWork: next }),
                    })
                    if (res.ok) {
                      setMessage({ type: 'success', text: next ? 'You are now visible to employers' : 'Your profile is now hidden from browse' })
                    } else {
                      setProfileData(prev => ({ ...prev, openToWork: !next }))
                      setMessage({ type: 'error', text: 'Failed to update visibility' })
                    }
                  } catch {
                    setProfileData(prev => ({ ...prev, openToWork: !next }))
                    setMessage({ type: 'error', text: 'Failed to update visibility' })
                  }
                }}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                  profileData.openToWork ? 'bg-brand-purple' : 'bg-brand-border'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    profileData.openToWork ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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

            {/* Open to Work toggle moved to top of profile form */}

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

          {/* Social Links */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-brand-text">Social Links</h2>
            <p className="text-xs text-brand-muted">Add your social media profiles. Only filled links will appear on your public profile.</p>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </span>
              </label>
              <input type="url" value={profileData.linkedinUrl} onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/your-username" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-muted" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </span>
              </label>
              <input type="url" value={profileData.githubUrl} onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })} placeholder="https://github.com/your-username" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-muted" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter / X
                </span>
              </label>
              <input type="url" value={profileData.twitterUrl} onChange={(e) => setProfileData({ ...profileData, twitterUrl: e.target.value })} placeholder="https://twitter.com/your-username" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </span>
              </label>
              <input type="url" value={profileData.facebookUrl} onChange={(e) => setProfileData({ ...profileData, facebookUrl: e.target.value })} placeholder="https://facebook.com/your-username" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/></svg>
                  Instagram
                </span>
              </label>
              <input type="url" value={profileData.instagramUrl} onChange={(e) => setProfileData({ ...profileData, instagramUrl: e.target.value })} placeholder="https://instagram.com/your-username" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                  Portfolio / Website
                </span>
              </label>
              <input type="url" value={profileData.portfolioUrl} onChange={(e) => setProfileData({ ...profileData, portfolioUrl: e.target.value })} placeholder="https://your-website.com" className="input-field" />
            </div>
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
