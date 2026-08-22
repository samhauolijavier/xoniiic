'use client'

type AdRow = {
  active: boolean
  imageUrl?: string | null
  startsAt?: string | null
  endsAt?: string | null
}

/** Why an ad is or is not on screen, in the order the checks actually run. */
function adState(ad: AdRow): { live: boolean; label: string } {
  if (!ad.imageUrl) return { live: false, label: 'No image' }
  if (!ad.active) return { live: false, label: 'Switched off' }
  const now = Date.now()
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) {
    return { live: false, label: `Starts ${new Date(ad.startsAt).toLocaleDateString('en-GB')}` }
  }
  if (ad.endsAt && new Date(ad.endsAt).getTime() < now) {
    return { live: false, label: 'Finished' }
  }
  return { live: true, label: 'Showing now' }
}


import { PLACEMENTS, isPlacement, AUDIENCES } from '@/lib/ads'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdSlot {
  id: string
  name: string
  placement: string
  audience?: string
  startsAt?: string | null
  endsAt?: string | null
  imageUrl: string
  linkUrl: string
  altText: string
  active: boolean
  advertiser: string | null
  clickCount: number
  viewCount: number
  createdAt: string
}

export default function AdminAdsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [ads, setAds] = useState<AdSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '', placement: 'sidebar', imageUrl: '', linkUrl: '', altText: '', advertiser: '',
    startsAt: '', endsAt: '', priority: '0', audience: 'all',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const spec = isPlacement(formData.placement) ? PLACEMENTS[formData.placement] : null

  async function uploadImage(file: File) {
    setUploading(true); setUploadError('')
    try {
      const body = new FormData()
      body.set('image', file)
      body.set('placement', formData.placement)
      const res = await fetch('/api/admin/ads/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Upload failed.'); return }
      setFormData(f => ({ ...f, imageUrl: data.url }))
    } catch {
      setUploadError('Could not reach the server.')
    } finally {
      setUploading(false)
    }
  }

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && user?.role !== 'admin')) {
      router.push('/')
    }
  }, [status, user, router])

  useEffect(() => {
    if (user?.role === 'admin') loadAds()
  }, [user])

  async function loadAds() {
    const res = await fetch('/api/admin/ads')
    if (res.ok) {
      const data = await res.json()
      setAds(data.ads)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowForm(false)
      setFormData({ name: '', placement: 'sidebar', imageUrl: '', linkUrl: '', altText: '', advertiser: '', startsAt: '', endsAt: '', priority: '0', audience: 'all' })
      loadAds()
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/ads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    loadAds()
  }

  async function deleteAd(id: string) {
    if (!confirm('Delete this ad slot?')) return
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' })
    loadAds()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-brand-muted hover:text-brand-text text-sm">Admin</Link>
            <span className="text-brand-border">/</span>
            <span className="text-sm text-brand-text">Ad Slots</span>
          </div>
          <h1 className="text-3xl font-black text-brand-text">
            Ad <span className="gradient-text">Management</span>
          </h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          + New Ad Slot
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-brand-text mb-4">Create Ad Slot</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Placement</label>
              {/* Footer and inline were offered and rendered nowhere. A slot
                  you can create but never see is a slot somebody sells and
                  then has to apologise for. */}
              <select value={formData.placement} onChange={e => setFormData({...formData, placement: e.target.value})} className="input-field">
                <option value="sidebar">Sidebar</option>
                <option value="banner">Banner</option>
              </select>
              {spec && (
                <p className="text-xs text-brand-muted mt-1">
                  <strong>{spec.width} × {spec.height}px.</strong> {spec.note}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Image</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f) }}
                className="text-sm w-full"
              />
              {uploading && <p className="text-xs text-brand-muted mt-1">Uploading…</p>}
              {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
              {formData.imageUrl && !uploading && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.imageUrl}
                    alt="Ad preview"
                    className="rounded-lg border border-brand-border bg-brand-card"
                    style={{ width: '100%', maxWidth: spec?.width ?? 300, aspectRatio: spec?.ratio, objectFit: 'contain' }}
                  />
                  <p className="text-xs text-brand-muted mt-1">
                    This is the shape it will render in. Anything not that ratio sits inside it
                    with space around, rather than being stretched.
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Link URL</label>
              <input type="url" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Alt text</label>
              <input type="text" value={formData.altText} onChange={e => setFormData({...formData, altText: e.target.value})} className="input-field" placeholder="Free CRM course — 50% off this month" required />
              <p className="text-xs text-brand-muted mt-1">
                What the image says, in words. Screen readers announce it to blind visitors, and
                it shows in place of the picture when one fails to load. Describe the offer, not
                the file — &ldquo;CRM course, 50% off&rdquo;, never &ldquo;banner image&rdquo;.
              </p>
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Advertiser</label>
              <input type="text" value={formData.advertiser} onChange={e => setFormData({...formData, advertiser: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Who sees it</label>
              <select value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})} className="input-field">
                {Object.entries(AUDIENCES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="text-xs text-brand-muted mt-1">
                A course affiliate wants freelancers; a CRM affiliate wants the people hiring them.
                Showing each side the other&apos;s ads wastes the slot and the click. Signed-out
                visitors only ever see &ldquo;Everyone&rdquo;.
              </p>
            </div>

            <div>
              <label className="text-xs text-brand-muted mb-1 block">Priority</label>
              <input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="input-field" />
              <p className="text-xs text-brand-muted mt-1">
                Higher shows first. Ads on the same number take turns, a minute each, so equals
                get equal share. Leave everything at 0 and they simply rotate.
              </p>
            </div>

            <div>
              <label className="text-xs text-brand-muted mb-1 block">Starts</label>
              <input type="date" value={formData.startsAt} onChange={e => setFormData({...formData, startsAt: e.target.value})} className="input-field" />
              <p className="text-xs text-brand-muted mt-1">Leave blank to run as soon as it is active.</p>
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Ends</label>
              <input type="date" value={formData.endsAt} onChange={e => setFormData({...formData, endsAt: e.target.value})} className="input-field" />
              <p className="text-xs text-brand-muted mt-1">
                Leave blank to run until you switch it off. Set it and the ad takes itself down —
                nobody has to remember the day a booking ends.
              </p>
            </div>

            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={saving || uploading || !formData.imageUrl} className="btn-primary text-sm">
                {saving ? 'Creating...' : 'Create Ad Slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted border-b border-brand-border">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Placement</th>
              <th className="p-4 font-medium">Audience</th>
              <th className="p-4 font-medium">Advertiser</th>
              <th className="p-4 font-medium">Views</th>
              <th className="p-4 font-medium">Clicks</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {ads.map((ad) => (
              <tr key={ad.id} className="text-brand-text hover:bg-brand-border/20 transition-colors">
                <td className="p-4 font-medium">{ad.name}</td>
                <td className="p-4 text-brand-muted capitalize">{ad.placement}</td>
                <td className="p-4 text-brand-muted text-xs">{AUDIENCES[(ad.audience ?? 'all') as keyof typeof AUDIENCES] ?? 'Everyone'}</td>
                <td className="p-4 text-brand-muted">{ad.advertiser || '-'}</td>
                <td className="p-4 text-brand-muted">{ad.viewCount}</td>
                <td className="p-4 text-brand-muted">{ad.clickCount}</td>
                <td className="p-4">
                  {/* "Active" answered the wrong question. An ad can be active
                      and still invisible — no image, a start date in the future,
                      an end date already past — and the only way to find out was
                      to go and look at the page. This says whether it is on
                      screen right now, and if not, why not. */}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${adState(ad).live ? 'bg-brand-purple/[0.10] text-brand-purple' : 'bg-brand-border text-brand-muted'}`}>
                    {adState(ad).label}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(ad.id, ad.active)} className="text-xs text-brand-muted hover:text-brand-text transition-colors">
                      {ad.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => deleteAd(ad.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ads.length === 0 && (
          <div className="p-12 text-center text-brand-muted">No ad slots created yet.</div>
        )}
      </div>
    </div>
  )
}
