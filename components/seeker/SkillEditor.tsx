'use client'

import { useState, useEffect } from 'react'

interface Skill {
  id: string
  name: string
  slug: string
  category: string
}

interface SelectedSkill {
  skillId: string
  name: string
  category: string
  rating: number
  yearsExp: number | null
}

interface SkillEditorProps {
  initialSkills?: SelectedSkill[]
  onChange: (skills: SelectedSkill[]) => void
}

const CATEGORIES = ['Development', 'Design', 'Virtual Assistant', 'Writing', 'Marketing', 'Other']

export function SkillEditor({ initialSkills = [], onChange }: SkillEditorProps) {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>(initialSkills)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSkills() {
      try {
        const res = await fetch('/api/skills')
        if (res.ok) {
          const data = await res.json()
          setAllSkills(data.skills)
        }
      } catch (err) {
        console.error('Failed to load skills', err)
      } finally {
        setLoading(false)
      }
    }
    loadSkills()
  }, [])

  useEffect(() => {
    onChange(selectedSkills)
  }, [selectedSkills, onChange])

  const filteredSkills = allSkills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || skill.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const isSelected = (skillId: string) => selectedSkills.some((s) => s.skillId === skillId)

  const handleToggle = (skill: Skill) => {
    if (isSelected(skill.id)) {
      setSelectedSkills((prev) => prev.filter((s) => s.skillId !== skill.id))
    } else {
      setSelectedSkills((prev) => [
        ...prev,
        { skillId: skill.id, name: skill.name, category: skill.category, rating: 5, yearsExp: null },
      ])
    }
  }

  const handleRatingChange = (skillId: string, rating: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, rating } : s))
    )
  }

  const handleYearsChange = (skillId: string, yearsExp: number | null) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, yearsExp } : s))
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
        />
        <div className="flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white'
                  : 'bg-brand-card border border-brand-border text-brand-muted hover:border-brand-purple hover:text-brand-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {filteredSkills.map((skill) => {
          const selected = isSelected(skill.id)
          return (
            <button
              key={skill.id}
              onClick={() => handleToggle(skill)}
              className={`p-2 rounded-lg text-left text-sm font-medium transition-all border ${
                selected
                  ? 'bg-purple-900/30 border-brand-purple text-purple-300'
                  : 'bg-brand-card border-brand-border text-brand-muted hover:border-brand-purple hover:text-brand-text'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {selected && (
                  <svg className="w-3.5 h-3.5 text-brand-purple flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {skill.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Skills with Ratings */}
      {selectedSkills.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-text">Rate Your Skills</h4>
          {selectedSkills.map((skill) => (
            <div key={skill.skillId} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-brand-text">{skill.name}</span>
                  <span className="text-xs text-brand-muted ml-2 bg-brand-border px-2 py-0.5 rounded-full">
                    {skill.category}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle({ id: skill.skillId, name: skill.name, slug: '', category: skill.category })}
                  className="text-brand-muted hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rating */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-brand-muted">
                  <span>Proficiency Level</span>
                  <span className="font-semibold text-brand-text">{skill.rating}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={skill.rating}
                  onChange={(e) => handleRatingChange(skill.skillId, parseInt(e.target.value))}
                  className="w-full accent-brand-purple"
                />
                <div className="flex justify-between text-xs text-brand-muted">
                  <span>Beginner</span>
                  <span>Expert</span>
                </div>
              </div>

              {/* Years Experience */}
              <div>
                <label className="text-xs text-brand-muted">Years Experience (optional)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  placeholder="e.g. 2.5"
                  value={skill.yearsExp ?? ''}
                  onChange={(e) =>
                    handleYearsChange(skill.skillId, e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="input-field mt-1 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSkills.length === 0 && (
        <p className="text-center text-brand-muted text-sm py-4">
          No skills selected yet. Click skills above to add them.
        </p>
      )}
    </div>
  )
}
