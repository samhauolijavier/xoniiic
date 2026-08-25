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
          className="flex-1 min-w-[220px] rounded-full bg-white/[0.06] border border-white/18 px-5 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/45 transition-colors"
        />
        <button className="btn-grad whitespace-nowrap" type="submit">Find someone</button>
      </form>

      <div className="flex gap-2 flex-wrap mt-3">
        {COMMON.map(term => (
          <button
            key={term}
            type="button"
            onClick={() => go(term)}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-white/18 text-white/65 hover:border-white/50 hover:text-white transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  )
}
