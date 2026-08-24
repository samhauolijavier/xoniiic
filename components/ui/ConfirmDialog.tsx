/*
 * Asking before something irreversible.
 *
 * Replaces window.confirm, which is browser chrome: unstyled, differently
 * shaped on every operating system, and on a phone it slides down from the top
 * looking like a system alert rather than part of the site. Every one of them
 * was a visible seam in an otherwise considered interface.
 *
 * The confirm button says what it does — "Remove role", not "OK". Somebody who
 * has read the title and skipped the body should still be able to tell from
 * the button alone which way is which.
 */
'use client'

import { useEffect, useRef } from 'react'

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body?: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    // Focus lands on Cancel, not Confirm. A dialog that opens with the
    // destructive action focused turns a stray Enter into a deletion.
    cancelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-text/50 animate-[fadeIn_120ms_ease-out]"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6 shadow-card"
      >
        <h2 className="font-semibold text-lg text-brand-text mb-1.5">{title}</h2>
        {body && <p className="text-sm text-brand-muted leading-relaxed mb-5">{body}</p>}
        <div className="flex gap-2 justify-end flex-wrap">
          <button ref={cancelRef} className="btn-secondary text-sm" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`text-sm font-medium rounded-lg px-4 py-2.5 text-white transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-purple hover:opacity-90'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
