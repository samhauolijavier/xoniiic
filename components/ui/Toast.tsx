/*
 * The confirmation that something happened.
 *
 * Actions across this site have been succeeding silently — you press Save and
 * the page looks identical, so you press it again, or assume it failed and go
 * looking. A toast is the smallest possible fix: it appears, says what
 * happened, and leaves.
 *
 * Three rules it follows.
 *
 * It never blocks. Unlike window.alert, the page stays usable underneath — a
 * confirmation is not worth taking someone's hands off the keyboard for.
 *
 * Errors stay until dismissed; successes leave on their own. Somebody who
 * missed "Saved" lost nothing. Somebody who missed "Could not save" thinks
 * their work is safe when it is not.
 *
 * And it is announced to screen readers via a live region, so an action that
 * only reports visually is not an action a blind user has to guess at.
 */
'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  toast: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Successes clear themselves; errors wait to be read. */
const AUTO_DISMISS_MS = 4000

let nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId++
    setToasts(t => [...t, { id, kind, message }])
    if (kind !== 'error') {
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    }
  }, [dismiss])

  const api: ToastApi = {
    toast,
    success: useCallback((m: string) => toast(m, 'success'), [toast]),
    error: useCallback((m: string) => toast(m, 'error'), [toast]),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        // polite, not assertive: a confirmation should wait for a natural pause
        // rather than interrupt whatever a screen reader is mid-sentence on.
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm"
      >
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [shown, setShown] = useState(false)

  // Mounted first, then animated in on the next frame — a transition cannot
  // run from a state the element was never in.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const tone =
    toast.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : toast.kind === 'error' ? 'border-red-200 bg-red-50 text-red-900'
    : 'border-brand-border bg-brand-card text-brand-text'

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-card transition-all duration-200 ${tone} ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <p className="text-sm leading-relaxed flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity flex-none -mt-0.5"
      >
        &times;
      </button>
    </div>
  )
}

/**
 * Falls back to doing nothing rather than throwing.
 *
 * A component rendered outside the provider — in a test, or a corner of the
 * app that has not been wrapped yet — should lose its confirmation message,
 * not crash the page it lives on.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (ctx) return ctx
  const noop = () => {}
  return { toast: noop, success: noop, error: noop }
}
