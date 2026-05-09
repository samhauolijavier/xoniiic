'use client'

import { useState, useCallback } from 'react'
import { Task, TaskStatus } from '@/lib/notion'
import { VA, CATEGORIES } from '@/lib/va-config'
import { TaskCard } from './TaskCard'
import { AddTaskModal } from './AddTaskModal'

const STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Done']

const STATUS_STYLES: Record<TaskStatus, { bg: string; border: string; dot: string; label: string }> = {
  'Not Started': {
    bg: 'bg-zinc-900/60',
    border: 'border-zinc-700/50',
    dot: 'bg-zinc-500',
    label: 'To Do',
  },
  'In Progress': {
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/40',
    dot: 'bg-blue-400',
    label: 'In Progress',
  },
  Blocked: {
    bg: 'bg-red-950/30',
    border: 'border-red-800/30',
    dot: 'bg-red-400',
    label: 'Blocked',
  },
  Done: {
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800/30',
    dot: 'bg-emerald-400',
    label: 'Done',
  },
}

interface Props {
  initialTasks: Task[]
  vas: VA[]
}

export function TaskBoard({ initialTasks, vas }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeVA, setActiveVA] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const filteredTasks = activeVA === 'all'
    ? tasks
    : tasks.filter((t) => {
        const va = vas.find((v) => v.name === t.assignedTo)
        return va?.id === activeVA
      })

  const tasksByStatus = STATUSES.reduce<Record<TaskStatus, Task[]>>((acc, s) => {
    acc[s] = filteredTasks.filter((t) => t.status === s)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    await fetch(`/api/notion/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }, [])

  const handleDelete = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await fetch(`/api/notion/tasks/${taskId}`, { method: 'DELETE' })
  }, [])

  const handleAdd = useCallback(async (data: {
    title: string
    priority: 'High' | 'Medium' | 'Low'
    categoryId: string
    categoryLabel: string
    project: string
    notes?: string
  }) => {
    setLoading(true)
    try {
      const res = await fetch('/api/notion/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      const newTask: Task = await res.json()
      setTasks((prev) => [newTask, ...prev])
      setShowModal(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const activeCount = filteredTasks.filter((t) => t.status !== 'Done').length

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* VA filter tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveVA('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeVA === 'all'
                ? 'bg-brand-purple text-white'
                : 'bg-brand-card text-brand-muted border border-brand-border hover:text-brand-text'
            }`}
          >
            All
          </button>
          {vas.map((va) => (
            <button
              key={va.id}
              onClick={() => setActiveVA(va.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeVA === va.id
                  ? 'bg-brand-purple text-white'
                  : 'bg-brand-card text-brand-muted border border-brand-border hover:text-brand-text'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold ${va.color}`}
              >
                {va.initials[0]}
              </span>
              {va.name}
              {va.status === 'upcoming' && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                  soon
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="text-sm text-brand-muted">
              {activeCount} open task{activeCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="text-lg leading-none">+</span>
            Add Task
          </button>
        </div>
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUSES.map((status) => {
          const style = STATUS_STYLES[status]
          const cols = tasksByStatus[status]
          return (
            <div
              key={status}
              className={`rounded-xl border ${style.border} ${style.bg} p-4 flex flex-col gap-3 min-h-[200px]`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="text-sm font-semibold text-brand-text">{style.label}</span>
                <span className="ml-auto text-xs text-brand-muted bg-brand-border/50 px-2 py-0.5 rounded-full">
                  {cols.length}
                </span>
              </div>

              {cols.length === 0 && (
                <p className="text-xs text-brand-muted/60 text-center py-6">Nothing here</p>
              )}

              {cols.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  vas={vas}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        })}
      </div>

      {showModal && (
        <AddTaskModal
          vas={vas}
          categories={CATEGORIES}
          loading={loading}
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
