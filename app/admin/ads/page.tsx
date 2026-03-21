'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdSlot {
  id: string
  name: string
  placement: string
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
  })
  const [saving, setSaving] = useState(false)

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
      setFormData({ name: '', placement: 'sidebar', imageUrl: '', linkUrl: '', altText: '', advertiser: '' })
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
              <select value={formData.placement} onChange={e => setFormData({...formData, placement: e.target.value})} className="input-field">
                <option value="sidebar">Sidebar</option>
                <option value="banner">Banner</option>
                <option value="footer">Footer</option>
                <option value="inline">Inline</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Image URL</label>
              <input type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Link URL</label>
              <input type="url" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Alt Text</label>
              <input type="text" value={formData.altText} onChange={e => setFormData({...formData, altText: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Advertiser</label>
              <input type="text" value={formData.advertiser} onChange={e => setFormData({...formData, advertiser: e.target.value})} className="input-field" />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
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
                <td className="p-4 text-brand-muted">{ad.advertiser || '-'}</td>
                <td className="p-4 text-brand-muted">{ad.viewCount}</td>
                <td className="p-4 text-brand-muted">{ad.clickCount}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${ad.active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                    {ad.active ? 'Active' : 'Inactive'}
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
