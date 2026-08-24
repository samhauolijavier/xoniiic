/*
 * One action instead of two.
 *
 * Somebody arriving on the business page already knows what they need. Two
 * buttons make them decide how to look before they can look; a search box lets
 * them say the thing they came to say. The chips underneath matter as much as
 * the box — they answer "what can I even ask for here?" without anyone having
 * to type to find out.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COMMON = [
  'Executive Assistant',
  'GoHighLevel',
  'Media Buying',
  'Bookkeeping',
  'Social Media',
]

export function HireSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')

  function go(term: string) {
    const t = term.trim()
    router.push(t ? `/browse?search=${encodeURIComponent(t)}` : '/browse')
  }

  return (
    <div>
      <form
        onSubmit={e => { e.preventDefault(); go(q) }}
        className="flex gap-2 flex-wrap items-stretch max-w-xl"
      >
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="What do you need done?"
          aria-label="What do you need done?"
          className="input-field flex-1 min-w-[220px]"
        />
        <button className="btn-primary" type="submit">Find someone</button>
      </form>

      <div className="flex gap-2 flex-wrap mt-3">
        {COMMON.map(term => (
          <button
            key={term}
            type="button"
            onClick={() => go(term)}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-brand-border text-brand-muted hover:border-brand-purple hover:text-brand-purple transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  )
}
