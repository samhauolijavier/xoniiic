'use client'

import { useState, useRef, useEffect } from 'react'
import { VFLogo } from '@/components/ui/Logo'
import Link from 'next/link'

const FONT_SIZES = [
  { label: 'XS', value: '1rem' },
  { label: 'SM', value: '1.25rem' },
  { label: 'MD', value: '1.5rem' },
  { label: 'LG', value: '1.875rem' },
  { label: 'XL', value: '2.25rem' },
  { label: '2XL', value: '2.75rem' },
]

interface SectionHeaderProps {
  title: string
  description: string
  icon: string
  open: boolean
  onToggle: () => void
}

function SectionHeader({ title, description, icon, open, onToggle }: SectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 text-left group"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-brand-text group-hover:gradient-text transition-all">{title}</h2>
        <p className="text-xs text-brand-muted">{description}</p>
      </div>
      <svg
        className={`w-5 h-5 text-brand-muted transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

function SaveButton({ onClick, saving, disabled, success }: {
  onClick: () => void
  saving: boolean
  disabled: boolean
  success: boolean
}) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={onClick}
        disabled={saving || disabled}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
      {success && <span className="text-emerald-400 text-sm">Saved!</span>}
    </div>
  )
}

export default function BrandingPage() {
  // Logo state
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [logoSuccess, setLogoSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Favicon state
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [faviconSuccess, setFaviconSuccess] = useState(false)
  const [faviconError, setFaviconError] = useState('')
  const faviconFileRef = useRef<HTMLInputElement>(null)

  // Font state
  const [fontSize, setFontSize] = useState('1.5rem')
  const [savedFontSize, setSavedFontSize] = useState('1.5rem')
  const [savingFont, setSavingFont] = useState(false)
  const [fontSuccess, setFontSuccess] = useState(false)

  // Hero content state
  const [heroTag, setHeroTag] = useState('100% Free for Employers \u2022 No Subscriptions')
  const [heroHeadline, setHeroHeadline] = useState('Find World-Class Remote Talent')
  const [heroSubtitle, setHeroSubtitle] = useState('Browse skilled freelancers in development, design, marketing, and more. Connect directly. No fees. No middlemen. Just talent.')
  const [heroCta1, setHeroCta1] = useState('Browse Talent Free')
  const [heroCta2, setHeroCta2] = useState('Post Your Profile')
  const [heroStat1Value, setHeroStat1Value] = useState('500+')
  const [heroStat1Label, setHeroStat1Label] = useState('Skilled Freelancers')
  const [heroStat2Value, setHeroStat2Value] = useState('Free')
  const [heroStat2Label, setHeroStat2Label] = useState('For Employers')
  const [heroStat3Value, setHeroStat3Value] = useState('50+')
  const [heroStat3Label, setHeroStat3Label] = useState('Skill Categories')
  const [savingHero, setSavingHero] = useState(false)
  const [heroSuccess, setHeroSuccess] = useState(false)

  // Announcement banner state
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [bannerStyle, setBannerStyle] = useState('gradient')
  const [savingBanner, setSavingBanner] = useState(false)
  const [bannerSuccess, setBannerSuccess] = useState(false)

  // Social links state
  const [socialTwitter, setSocialTwitter] = useState('')
  const [socialInstagram, setSocialInstagram] = useState('')
  const [socialLinkedin, setSocialLinkedin] = useState('')
  const [socialDiscord, setSocialDiscord] = useState('')
  const [socialTiktok, setSocialTiktok] = useState('')
  const [socialYoutube, setSocialYoutube] = useState('')
  const [savingSocial, setSavingSocial] = useState(false)
  const [socialSuccess, setSocialSuccess] = useState(false)

  // SEO state
  const [seoTitle, setSeoTitle] = useState('Virtual Freaks — Find World-Class Remote Talent')
  const [seoDescription, setSeoDescription] = useState('Browse skilled freelancers in development, design, marketing, and more. Connect directly with top remote talent.')
  const [seoKeywords, setSeoKeywords] = useState('freelancer, remote work, hire talent, virtual assistant, developer')
  const [savingSeo, setSavingSeo] = useState(false)
  const [seoSuccess, setSeoSuccess] = useState(false)

  // Footer state
  const [footerTagline, setFooterTagline] = useState('The marketplace for remote talent.')
  const [footerCopyright, setFooterCopyright] = useState('Virtual Freaks')
  const [savingFooter, setSavingFooter] = useState(false)
  const [footerSuccess, setFooterSuccess] = useState(false)

  // Section open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    logo: true,
    favicon: false,
    font: false,
    hero: false,
    banner: false,
    social: false,
    seo: false,
    footer: false,
  })

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Load all settings
  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.text())
      .then((text) => {
        if (!text) return
        const data = JSON.parse(text)
        if (data.logoUrl) setCurrentLogo(data.logoUrl)
        if (data.faviconUrl) setCurrentFavicon(data.faviconUrl)
        if (data.brandFontSize) { setFontSize(data.brandFontSize); setSavedFontSize(data.brandFontSize) }
        // Hero
        if (data.heroTag) setHeroTag(data.heroTag)
        if (data.heroHeadline) setHeroHeadline(data.heroHeadline)
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle)
        if (data.heroCta1) setHeroCta1(data.heroCta1)
        if (data.heroCta2) setHeroCta2(data.heroCta2)
        if (data.heroStat1Value) setHeroStat1Value(data.heroStat1Value)
        if (data.heroStat1Label) setHeroStat1Label(data.heroStat1Label)
        if (data.heroStat2Value) setHeroStat2Value(data.heroStat2Value)
        if (data.heroStat2Label) setHeroStat2Label(data.heroStat2Label)
        if (data.heroStat3Value) setHeroStat3Value(data.heroStat3Value)
        if (data.heroStat3Label) setHeroStat3Label(data.heroStat3Label)
        // Banner
        if (data.bannerEnabled) setBannerEnabled(data.bannerEnabled === 'true')
        if (data.bannerText) setBannerText(data.bannerText)
        if (data.bannerLink) setBannerLink(data.bannerLink)
        if (data.bannerStyle) setBannerStyle(data.bannerStyle)
        // Social
        if (data.socialTwitter) setSocialTwitter(data.socialTwitter)
        if (data.socialInstagram) setSocialInstagram(data.socialInstagram)
        if (data.socialLinkedin) setSocialLinkedin(data.socialLinkedin)
        if (data.socialDiscord) setSocialDiscord(data.socialDiscord)
        if (data.socialTiktok) setSocialTiktok(data.socialTiktok)
        if (data.socialYoutube) setSocialYoutube(data.socialYoutube)
        // SEO
        if (data.seoTitle) setSeoTitle(data.seoTitle)
        if (data.seoDescription) setSeoDescription(data.seoDescription)
        if (data.seoKeywords) setSeoKeywords(data.seoKeywords)
        // Footer
        if (data.footerTagline) setFooterTagline(data.footerTagline)
        if (data.footerCopyright) setFooterCopyright(data.footerCopyright)
      })
      .catch(() => {})
  }, [])

  // Save helpers
  async function saveSettings(data: Record<string, string>) {
    const res = await fetch('/api/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  }

  // Logo handlers
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Please select a file first'); return }
    setUploading(true)
    setError('')
    const form = new FormData()
    form.append('logo', file)
    let data: { logoUrl?: string; error?: string } = {}
    try {
      const res = await fetch('/api/admin/logo', { method: 'POST', body: form })
      const text = await res.text()
      data = text ? JSON.parse(text) : {}
      if (!res.ok) { setUploading(false); setError(data.error || 'Upload failed'); return }
    } catch (err) {
      setUploading(false)
      setError('Upload failed — check console for details')
      console.error(err)
      return
    }
    setUploading(false)
    setCurrentLogo(data.logoUrl || null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    setLogoSuccess(true)
    setTimeout(() => setLogoSuccess(false), 3000)
  }

  async function handleReset() {
    if (!confirm('Reset to the default SVG logo?')) return
    await fetch('/api/admin/logo', { method: 'DELETE' })
    setCurrentLogo(null)
    setPreview(null)
  }

  // Favicon handlers
  function handleFaviconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFaviconError('')
    const reader = new FileReader()
    reader.onload = (ev) => setFaviconPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleFaviconUpload() {
    const file = faviconFileRef.current?.files?.[0]
    if (!file) { setFaviconError('Please select a file first'); return }
    setFaviconUploading(true)
    setFaviconError('')
    const form = new FormData()
    form.append('favicon', file)
    let data: { faviconUrl?: string; error?: string } = {}
    try {
      const res = await fetch('/api/admin/favicon', { method: 'POST', body: form })
      const text = await res.text()
      data = text ? JSON.parse(text) : {}
      if (!res.ok) { setFaviconUploading(false); setFaviconError(data.error || 'Upload failed'); return }
    } catch (err) {
      setFaviconUploading(false)
      setFaviconError('Upload failed — check console for details')
      console.error(err)
      return
    }
    setFaviconUploading(false)
    setCurrentFavicon(data.faviconUrl || null)
    setFaviconPreview(null)
    if (faviconFileRef.current) faviconFileRef.current.value = ''
    setFaviconSuccess(true)
    setTimeout(() => setFaviconSuccess(false), 3000)
  }

  async function handleFaviconReset() {
    if (!confirm('Reset to the default favicon?')) return
    await fetch('/api/admin/favicon', { method: 'DELETE' })
    setCurrentFavicon(null)
    setFaviconPreview(null)
  }

  async function handleSaveFont() {
    setSavingFont(true)
    const ok = await saveSettings({ brandFontSize: fontSize })
    if (ok) { setSavedFontSize(fontSize); setFontSuccess(true); setTimeout(() => setFontSuccess(false), 3000) }
    setSavingFont(false)
  }

  async function handleSaveHero() {
    setSavingHero(true)
    const ok = await saveSettings({
      heroTag, heroHeadline, heroSubtitle, heroCta1, heroCta2,
      heroStat1Value, heroStat1Label, heroStat2Value, heroStat2Label, heroStat3Value, heroStat3Label,
    })
    if (ok) { setHeroSuccess(true); setTimeout(() => setHeroSuccess(false), 3000) }
    setSavingHero(false)
  }

  async function handleSaveBanner() {
    setSavingBanner(true)
    const ok = await saveSettings({
      bannerEnabled: bannerEnabled ? 'true' : 'false',
      bannerText, bannerLink, bannerStyle,
    })
    if (ok) { setBannerSuccess(true); setTimeout(() => setBannerSuccess(false), 3000) }
    setSavingBanner(false)
  }

  async function handleSaveSocial() {
    setSavingSocial(true)
    const ok = await saveSettings({
      socialTwitter, socialInstagram, socialLinkedin,
      socialDiscord, socialTiktok, socialYoutube,
    })
    if (ok) { setSocialSuccess(true); setTimeout(() => setSocialSuccess(false), 3000) }
    setSavingSocial(false)
  }

  async function handleSaveSeo() {
    setSavingSeo(true)
    const ok = await saveSettings({ seoTitle, seoDescription, seoKeywords })
    if (ok) { setSeoSuccess(true); setTimeout(() => setSeoSuccess(false), 3000) }
    setSavingSeo(false)
  }

  async function handleSaveFooter() {
    setSavingFooter(true)
    const ok = await saveSettings({ footerTagline, footerCopyright })
    if (ok) { setFooterSuccess(true); setTimeout(() => setFooterSuccess(false), 3000) }
    setSavingFooter(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-brand-muted hover:text-brand-text transition-colors text-sm">
          ← Admin
        </Link>
        <span className="text-brand-muted">/</span>
        <h1 className="text-2xl font-black text-brand-text">
          Brand <span className="gradient-text">Settings</span>
        </h1>
      </div>

      {/* Live Preview */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Live Preview</h2>
        <div className="flex items-center gap-3 bg-brand-bg rounded-xl px-6 py-4 border border-brand-border">
          {currentLogo ? (
            <img src={currentLogo} alt="Site logo" className="h-9 w-auto object-contain" />
          ) : (
            <VFLogo size={36} />
          )}
          <span
            className="gradient-text"
            style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, letterSpacing: '0.08em', fontSize, lineHeight: '1' }}
          >
            Virtual Freaks
          </span>
        </div>
        {bannerEnabled && bannerText && (
          <div className={`mt-3 rounded-lg px-4 py-2 text-sm text-center font-medium ${
            bannerStyle === 'gradient'
              ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
              : bannerStyle === 'info'
              ? 'bg-blue-900/40 text-blue-300 border border-blue-700/40'
              : bannerStyle === 'warning'
              ? 'bg-amber-900/40 text-amber-300 border border-amber-700/40'
              : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
          }`}>
            {bannerText}
          </div>
        )}
      </div>

      <div className="space-y-4">

        {/* ─── Logo Upload ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="🖼️"
            title="Site Logo"
            description="Upload a custom logo or use the default"
            open={openSections.logo}
            onToggle={() => toggleSection('logo')}
          />
          {openSections.logo && (
            <div className="mt-5 pt-5 border-t border-brand-border">
              <div
                className="border-2 border-dashed border-brand-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-purple transition-colors mb-4"
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-24 mx-auto object-contain" />
                ) : (
                  <div className="space-y-2">
                    <div className="text-3xl">🖼️</div>
                    <p className="text-brand-text font-medium">Click to select logo file</p>
                    <p className="text-brand-muted text-sm">PNG, JPG, SVG or WebP — transparent background recommended</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              {logoSuccess && <p className="text-emerald-400 text-sm mb-3">Logo updated!</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!preview || uploading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {uploading ? 'Uploading...' : 'Upload & Apply'}
                </button>
                {currentLogo && (
                  <button onClick={handleReset} className="btn-secondary text-red-400 hover:text-red-300 text-sm">
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Favicon Upload ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="⭐"
            title="Site Favicon"
            description="Upload a custom favicon (browser tab icon)"
            open={openSections.favicon}
            onToggle={() => toggleSection('favicon')}
          />
          {openSections.favicon && (
            <div className="mt-5 pt-5 border-t border-brand-border">
              {currentFavicon && (
                <div className="mb-4">
                  <p className="text-sm text-brand-muted mb-2">Current favicon:</p>
                  <img src={currentFavicon} alt="Current favicon" className="h-8 w-8 object-contain rounded border border-brand-border" />
                </div>
              )}
              <div
                className="border-2 border-dashed border-brand-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-purple transition-colors mb-4"
                onClick={() => faviconFileRef.current?.click()}
              >
                {faviconPreview ? (
                  <img src={faviconPreview} alt="Favicon preview" className="max-h-16 mx-auto object-contain" />
                ) : (
                  <div className="space-y-2">
                    <div className="text-3xl">⭐</div>
                    <p className="text-brand-text font-medium">Click to select favicon file</p>
                    <p className="text-brand-muted text-sm">ICO, PNG, or SVG — Recommended size: 32x32px or 64x64px</p>
                  </div>
                )}
              </div>
              <input
                ref={faviconFileRef}
                type="file"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,.ico"
                className="hidden"
                onChange={handleFaviconFileChange}
              />
              {faviconError && <p className="text-red-400 text-sm mb-3">{faviconError}</p>}
              {faviconSuccess && <p className="text-emerald-400 text-sm mb-3">Favicon updated!</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleFaviconUpload}
                  disabled={!faviconPreview || faviconUploading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {faviconUploading ? 'Uploading...' : 'Upload & Apply'}
                </button>
                {currentFavicon && (
                  <button onClick={handleFaviconReset} className="btn-secondary text-red-400 hover:text-red-300 text-sm">
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Brand Font Size ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="🔤"
            title="Brand Name Font Size"
            description="Control the navbar brand name size"
            open={openSections.font}
            onToggle={() => toggleSection('font')}
          />
          {openSections.font && (
            <div className="mt-5 pt-5 border-t border-brand-border">
              <div className="flex flex-wrap gap-2 mb-4">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFontSize(s.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      fontSize === s.value
                        ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white border-transparent'
                        : 'bg-brand-card border-brand-border text-brand-muted hover:border-brand-purple hover:text-brand-text'
                    }`}
                  >
                    {s.label}
                    <span className="ml-1.5 text-xs opacity-60">{s.value}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-brand-muted whitespace-nowrap">Custom:</label>
                <input
                  type="text"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  placeholder="e.g. 1.75rem"
                  className="input-field max-w-[160px] text-sm"
                />
              </div>
              {fontSize !== savedFontSize && (
                <p className="text-amber-400 text-xs mb-3">Unsaved changes</p>
              )}
              <SaveButton onClick={handleSaveFont} saving={savingFont} disabled={fontSize === savedFontSize} success={fontSuccess} />
            </div>
          )}
        </div>

        {/* ─── Hero Section Content ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="🏠"
            title="Homepage Hero"
            description="Edit the headline, subtitle, CTAs, and stats on the landing page"
            open={openSections.hero}
            onToggle={() => toggleSection('hero')}
          />
          {openSections.hero && (
            <div className="mt-5 pt-5 border-t border-brand-border space-y-5">
              {/* Tag line */}
              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Top Tag</label>
                <input
                  type="text"
                  value={heroTag}
                  onChange={(e) => setHeroTag(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="e.g. 100% Free for Employers"
                />
                <p className="text-xs text-brand-muted mt-1">The pill badge above the headline</p>
              </div>

              {/* Headline */}
              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Headline</label>
                <input
                  type="text"
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="Find World-Class Remote Talent"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Subtitle</label>
                <textarea
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  rows={3}
                  className="input-field text-sm w-full"
                  placeholder="Describe what Virtual Freaks offers..."
                />
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-text block mb-1">Primary CTA</label>
                  <input
                    type="text"
                    value={heroCta1}
                    onChange={(e) => setHeroCta1(e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-text block mb-1">Secondary CTA</label>
                  <input
                    type="text"
                    value={heroCta2}
                    onChange={(e) => setHeroCta2(e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>
              </div>

              {/* Stats */}
              <div>
                <label className="text-sm font-medium text-brand-text block mb-2">Hero Stats</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <input type="text" value={heroStat1Value} onChange={(e) => setHeroStat1Value(e.target.value)} className="input-field text-sm w-full text-center" placeholder="500+" />
                    <input type="text" value={heroStat1Label} onChange={(e) => setHeroStat1Label(e.target.value)} className="input-field text-xs w-full text-center" placeholder="Label" />
                  </div>
                  <div className="space-y-1">
                    <input type="text" value={heroStat2Value} onChange={(e) => setHeroStat2Value(e.target.value)} className="input-field text-sm w-full text-center" placeholder="Free" />
                    <input type="text" value={heroStat2Label} onChange={(e) => setHeroStat2Label(e.target.value)} className="input-field text-xs w-full text-center" placeholder="Label" />
                  </div>
                  <div className="space-y-1">
                    <input type="text" value={heroStat3Value} onChange={(e) => setHeroStat3Value(e.target.value)} className="input-field text-sm w-full text-center" placeholder="50+" />
                    <input type="text" value={heroStat3Label} onChange={(e) => setHeroStat3Label(e.target.value)} className="input-field text-xs w-full text-center" placeholder="Label" />
                  </div>
                </div>
              </div>

              <SaveButton onClick={handleSaveHero} saving={savingHero} disabled={false} success={heroSuccess} />
            </div>
          )}
        </div>

        {/* ─── Announcement Banner ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="📢"
            title="Announcement Banner"
            description="Show a site-wide banner at the top of every page"
            open={openSections.banner}
            onToggle={() => toggleSection('banner')}
          />
          {openSections.banner && (
            <div className="mt-5 pt-5 border-t border-brand-border space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBannerEnabled(!bannerEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    bannerEnabled ? 'bg-emerald-500' : 'bg-brand-border'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      bannerEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-brand-text font-medium">
                  {bannerEnabled ? 'Banner is live' : 'Banner is hidden'}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Banner Message</label>
                <input
                  type="text"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="e.g. We just launched! Welcome to Virtual Freaks"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Link URL (optional)</label>
                <input
                  type="text"
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="e.g. /browse or https://..."
                />
                <p className="text-xs text-brand-muted mt-1">Makes the banner clickable</p>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-text block mb-2">Style</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'gradient', label: 'Gradient', preview: 'bg-gradient-to-r from-brand-purple to-brand-orange text-white' },
                    { value: 'info', label: 'Info', preview: 'bg-blue-900/40 text-blue-300 border border-blue-700/40' },
                    { value: 'warning', label: 'Warning', preview: 'bg-amber-900/40 text-amber-300 border border-amber-700/40' },
                    { value: 'success', label: 'Success', preview: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setBannerStyle(s.value)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${s.preview} ${
                        bannerStyle === s.value ? 'ring-2 ring-white/40' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <SaveButton onClick={handleSaveBanner} saving={savingBanner} disabled={false} success={bannerSuccess} />
            </div>
          )}
        </div>

        {/* ─── Social Links ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="🔗"
            title="Social Links"
            description="Your social media profiles shown in the footer"
            open={openSections.social}
            onToggle={() => toggleSection('social')}
          />
          {openSections.social && (
            <div className="mt-5 pt-5 border-t border-brand-border space-y-3">
              {[
                { label: 'X (Twitter)', value: socialTwitter, setter: setSocialTwitter, placeholder: 'https://x.com/virtualfreaks' },
                { label: 'Instagram', value: socialInstagram, setter: setSocialInstagram, placeholder: 'https://instagram.com/virtualfreaks' },
                { label: 'LinkedIn', value: socialLinkedin, setter: setSocialLinkedin, placeholder: 'https://linkedin.com/company/virtualfreaks' },
                { label: 'Discord', value: socialDiscord, setter: setSocialDiscord, placeholder: 'https://discord.gg/invite-code' },
                { label: 'TikTok', value: socialTiktok, setter: setSocialTiktok, placeholder: 'https://tiktok.com/@virtualfreaks' },
                { label: 'YouTube', value: socialYoutube, setter: setSocialYoutube, placeholder: 'https://youtube.com/@virtualfreaks' },
              ].map((social) => (
                <div key={social.label} className="flex items-center gap-3">
                  <label className="text-sm text-brand-muted w-20 sm:w-24 flex-shrink-0">{social.label}</label>
                  <input
                    type="text"
                    value={social.value}
                    onChange={(e) => social.setter(e.target.value)}
                    className="input-field text-sm flex-1"
                    placeholder={social.placeholder}
                  />
                </div>
              ))}
              <SaveButton onClick={handleSaveSocial} saving={savingSocial} disabled={false} success={socialSuccess} />
            </div>
          )}
        </div>

        {/* ─── SEO & Meta ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="🔍"
            title="SEO & Meta Tags"
            description="Control how your site appears in search results"
            open={openSections.seo}
            onToggle={() => toggleSection('seo')}
          />
          {openSections.seo && (
            <div className="mt-5 pt-5 border-t border-brand-border space-y-4">
              {/* Google preview */}
              <div className="bg-white rounded-lg p-4 mb-2">
                <p className="text-blue-700 text-lg font-medium truncate">{seoTitle || 'Virtual Freaks'}</p>
                <p className="text-green-700 text-sm">virtualfreaks.com</p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{seoDescription || 'No description set.'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Page Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="Virtual Freaks — Find World-Class Remote Talent"
                />
                <p className="text-xs text-brand-muted mt-1">{seoTitle.length}/60 characters (recommended)</p>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Meta Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={2}
                  className="input-field text-sm w-full"
                  placeholder="Describe your site for search engines..."
                />
                <p className="text-xs text-brand-muted mt-1">{seoDescription.length}/160 characters (recommended)</p>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Keywords</label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="freelancer, remote work, hire talent..."
                />
                <p className="text-xs text-brand-muted mt-1">Comma-separated keywords</p>
              </div>

              <SaveButton onClick={handleSaveSeo} saving={savingSeo} disabled={false} success={seoSuccess} />
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="card p-6">
          <SectionHeader
            icon="📄"
            title="Footer"
            description="Customize footer text and branding"
            open={openSections.footer}
            onToggle={() => toggleSection('footer')}
          />
          {openSections.footer && (
            <div className="mt-5 pt-5 border-t border-brand-border space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Footer Tagline</label>
                <input
                  type="text"
                  value={footerTagline}
                  onChange={(e) => setFooterTagline(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="The marketplace for remote talent."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-text block mb-1">Copyright Name</label>
                <input
                  type="text"
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="Virtual Freaks"
                />
                <p className="text-xs text-brand-muted mt-1">Shows as &quot;© 2026 {footerCopyright}. All rights reserved.&quot;</p>
              </div>
              <SaveButton onClick={handleSaveFooter} saving={savingFooter} disabled={false} success={footerSuccess} />
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6 bg-brand-card/50 mt-6">
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">Tips</h2>
        <ul className="space-y-2 text-sm text-brand-muted">
          <li>&#10003; Changes apply <strong className="text-brand-text">instantly</strong> across the whole site after saving</li>
          <li>&#10003; The announcement banner appears <strong className="text-brand-text">above the navbar</strong> on every page</li>
          <li>&#10003; SEO changes may take time to reflect in <strong className="text-brand-text">Google search results</strong></li>
          <li>&#10003; Social links with empty URLs are <strong className="text-brand-text">automatically hidden</strong></li>
          <li>&#10003; Use transparent <strong className="text-brand-text">PNG logos</strong> for the cleanest look</li>
        </ul>
      </div>
    </div>
  )
}
