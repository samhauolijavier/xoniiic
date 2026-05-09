'use client'

import { useState, useEffect } from 'react'
import { VA, Category, PROJECTS } from '@/lib/va-config'
import { TaskPriority } from '@/lib/notion'

interface Props {
  vas: VA[]
  categories: Category[]
  loading: boolean
  onSubmit: (data: {
    title: string
    priority: TaskPriority
    categoryId: string
    categoryLabel: string
    project: string
    notes?: string
  }) => void
  onClose: () => void
}

export function AddTaskModal({ vas, categories, loading, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [categoryId, setCategoryId] = useState('')
  const [notes, setNotes] = useState('')

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const assignedVA = selectedCategory
    ? vas.find((v) => v.id === selectedCategory.assignedTo)
    : null

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !categoryId || !selectedCategory) return
    onSubmit({
      title: title.trim(),
      priority,
      categoryId,
      categoryLabel: selectedCategory.label,
      project: selectedCategory.project,
      notes: notes.trim() || undefined,
    })
  }

  // Group categories by project for the select
  const grouped = PROJECTS.reduce<Record<string, Category[]>>((acc, p) => {
    acc[p] = categories.filter((c) => c.project === p)
    return acc
  }, {})

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-md shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <h2 className="text-lg font-bold text-brand-text">Add Task</h2>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-brand-text transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
              Task
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to happen?"
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple"
              required
            />
          </div>

          {/* Category → drives auto-assign */}
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-purple"
              required
            >
              <option value="" disabled>Select a category...</option>
              {Object.entries(grouped).map(([project, cats]) =>
                cats.length > 0 ? (
                  <optgroup key={project} label={project}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>

            {/* Auto-assign preview */}
            {assignedVA && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${assignedVA.color}`}>
                  {assignedVA.initials[0]}
                </span>
                <span className="text-xs text-brand-muted">
                  Auto-assigned to <strong className="text-brand-text">{assignedVA.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
              Priority
            </label>
            <div className="flex gap-2">
              {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    priority === p
                      ? p === 'High'
                        ? 'bg-red-900/60 border-red-600 text-red-300'
                        : p === 'Medium'
                        ? 'bg-yellow-900/40 border-yellow-600 text-yellow-300'
                        : 'bg-zinc-800 border-zinc-500 text-zinc-300'
                      : 'bg-brand-bg border-brand-border text-brand-muted hover:border-brand-purple/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
              Notes <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context or instructions..."
              rows={3}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !categoryId}
            className="w-full py-2.5 rounded-lg bg-gradient-brand text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
