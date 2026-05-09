'use client'

import { useState } from 'react'
import { Task, TaskStatus } from '@/lib/notion'
import { VA } from '@/lib/va-config'

const STATUS_OPTIONS: TaskStatus[] = ['Not Started', 'In Progress', 'Done', 'Blocked']

const PRIORITY_STYLES = {
  High: 'text-red-400 bg-red-950/50 border-red-800/40',
  Medium: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/30',
  Low: 'text-zinc-400 bg-zinc-900/60 border-zinc-700/40',
}

interface Props {
  task: Task
  vas: VA[]
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, vas, onStatusChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const va = vas.find((v) => v.name === task.assignedTo)

  return (
    <div className="bg-brand-card border border-brand-border rounded-lg p-3 space-y-2 hover:border-brand-purple/40 transition-colors group">
      {/* Title row */}
      <div className="flex items-start gap-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 text-left text-sm font-medium text-brand-text leading-snug"
        >
          {task.title}
        </button>
        <span
          className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* VA avatar */}
        {va && (
          <span
            className={`flex items-center gap-1 text-xs text-white px-1.5 py-0.5 rounded-full ${va.color}`}
          >
            <span className="font-bold">{va.initials}</span>
          </span>
        )}

        {/* Category chip */}
        <span className="text-xs text-brand-muted bg-brand-border/60 px-2 py-0.5 rounded-full truncate max-w-[140px]">
          {task.categoryLabel || task.project}
        </span>
      </div>

      {/* Expanded: notes + status changer */}
      {expanded && (
        <div className="pt-1 space-y-2 border-t border-brand-border/60">
          {task.notes && (
            <p className="text-xs text-brand-muted leading-relaxed">{task.notes}</p>
          )}

          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(task.id, s)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                  task.status === s
                    ? 'bg-brand-purple border-brand-purple text-white'
                    : 'border-brand-border text-brand-muted hover:border-brand-purple/50 hover:text-brand-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-500/60 hover:text-red-400 transition-colors"
            >
              Archive task
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-muted">Sure?</span>
              <button
                onClick={() => onDelete(task.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Yes, archive
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-brand-muted hover:text-brand-text"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick status change — inline toggle for Done */}
      {!expanded && (
        <button
          onClick={() =>
            onStatusChange(task.id, task.status === 'Done' ? 'Not Started' : 'Done')
          }
          className="text-xs text-brand-muted/50 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          {task.status === 'Done' ? '↩ Reopen' : '✓ Mark done'}
        </button>
      )}
    </div>
  )
}
