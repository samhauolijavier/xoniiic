'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Skill {
  id: string
  name: string
  slug: string
  category: string
  active: boolean
  isCustom: boolean
  createdAt: string
  _count?: { seekerSkills: number }
}

const CATEGORIES = ['Development', 'Design', 'Virtual Assistant', 'Writing', 'Marketing', 'Other']

export default function AdminSkillsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', category: 'Development' })
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')
  const [search, setSearch] = useState('')

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && user?.role !== 'admin')) {
      router.push('/')
    }
  }, [status, user, router])

  useEffect(() => {
    if (user?.role === 'admin') loadSkills()
  }, [user])

  async function loadSkills() {
    const res = await fetch('/api/skills')
    if (res.ok) {
      const data = await res.json()
      setSkills(data.skills)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowForm(false)
      setFormData({ name: '', category: 'Development' })
      loadSkills()
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/skills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    loadSkills()
  }

  const filteredSkills = skills.filter(s => {
    const matchesCat = filterCategory === 'All' || s.category === filterCategory
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const skillsByCategory = CATEGORIES.reduce<Record<string, Skill[]>>((acc, cat) => {
    acc[cat] = filteredSkills.filter(s => s.category === cat)
    return acc
  }, {})

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-brand-muted hover:text-brand-text text-sm">Admin</Link>
            <span className="text-brand-border">/</span>
            <span className="text-sm text-brand-text">Skills</span>
          </div>
          <h1 className="text-3xl font-black text-brand-text">
            Skill <span className="gradient-text">Library</span>
          </h1>
          <p className="text-brand-muted mt-1">{skills.length} skills across {CATEGORIES.length} categories</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          + Add Skill
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-brand-text mb-4">Add New Skill</h2>
          <form onSubmit={handleCreate} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-brand-muted mb-1 block">Skill Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
            </div>
            <div className="flex-1 min-w-48">
              <label className="text-xs text-brand-muted mb-1 block">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 items-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Adding...' : 'Add Skill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-xs text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
                  : 'bg-brand-card border border-brand-border text-brand-muted hover:border-brand-purple'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills by Category */}
      <div className="space-y-6">
        {CATEGORIES.map(cat => {
          const catSkills = skillsByCategory[cat]
          if (catSkills.length === 0 && (filterCategory !== 'All' && filterCategory !== cat)) return null
          if (catSkills.length === 0) return null

          return (
            <div key={cat} className="card p-6">
              <h2 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                {cat}
                <span className="text-xs text-brand-muted bg-brand-border px-2 py-0.5 rounded-full">
                  {catSkills.length} skills
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {catSkills.map(skill => (
                  <div
                    key={skill.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all ${
                      skill.active
                        ? 'border-brand-border bg-brand-border/20 text-brand-text'
                        : 'border-red-900/30 bg-red-900/10 text-brand-muted opacity-60'
                    }`}
                  >
                    <span className="truncate">{skill.name}</span>
                    <button
                      onClick={() => toggleActive(skill.id, skill.active)}
                      className={`ml-2 flex-shrink-0 text-xs px-1.5 py-0.5 rounded transition-colors ${
                        skill.active
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {skill.active ? 'Off' : 'On'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
