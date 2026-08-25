/*
 * Browse by category.
 *
 * Two rewrites ago this was six emoji in rounded gradient tiles — the treatment
 * on every generated landing page of the last two years. It became a plain
 * ruled grid, which fixed the cliché and introduced a different problem: six
 * identical grey cells, no hierarchy, and a number nobody could interpret.
 *
 * It is a list now rather than a grid. Full-width rows scan faster than a 3x2
 * block, they still work at twelve categories, and the brand arrives as a tick
 * against each name instead of as a background.
 *
 * The bigger change is what a row contains. Nobody thinks "I need a Marketing
 * person" — they think "I need someone who can run Meta ads". So the
 * description sentence is gone and the skills themselves are links. Six
 * clickable areas becomes thirty, each landing on a real search, each a term
 * somebody actually types into Google.
 *
 * And the count is people now, not skills. The old number was how many skills
 * existed in a category, which read as how many freelancers were in it. It
 * flattered us at launch and would have badly undersold us later, and it was
 * never the number a person browsing wanted.
 */
import Link from 'next/link'
import { db, withRetry } from '@/lib/db'
import { publiclyListable } from '@/lib/constants'

/* Stops from the mark, assigned by name so the colours do not shuffle when the
   rows reorder. "Other" stays grey — it is a catch-all, not a category. */
const CATEGORIES: { name: string; tick: string; fallback: string[] }[] = [
  { name: 'Virtual Assistant', tick: '#d946ef', fallback: ['Admin', 'Customer support', 'Research'] },
  { name: 'Development', tick: '#e879f9', fallback: ['React', 'Node.js', 'Python'] },
  { name: 'Design', tick: '#f472b6', fallback: ['Figma', 'UI/UX', 'Branding'] },
  { name: 'Marketing', tick: '#fb923c', fallback: ['Ads', 'SEO', 'Social media'] },
  { name: 'Writing', tick: '#facc15', fallback: ['Copywriting', 'Blog', 'Technical'] },
  { name: 'Other', tick: '#a3a3a3', fallback: ['Finance', 'HR', 'Translation'] },
]

const CHIPS_PER_ROW = 5

export async function CategoryGrid() {
  // People per category, and the skills those people actually hold. One read
  // rather than twelve, and it guarantees every chip leads somewhere with
  // somebody in it — a link to an empty result is worse than no link.
  const people = new Map<string, Set<string>>()
  const skillHolders = new Map<string, Map<string, number>>()

  try {
    const rows = await withRetry(() => db.seekerSkill.findMany({
      where: {
        profile: { openToWork: true, user: publiclyListable() },
      },
      select: {
        profileId: true,
        skill: { select: { name: true, category: true } },
      },
    }))

    for (const row of rows) {
      const category = row.skill.category
      if (!people.has(category)) people.set(category, new Set())
      people.get(category)!.add(row.profileId)

      if (!skillHolders.has(category)) skillHolders.set(category, new Map())
      const bucket = skillHolders.get(category)!
      bucket.set(row.skill.name, (bucket.get(row.skill.name) ?? 0) + 1)
    }
  } catch (error) {
    // Falls back to the written skill lists below. A category with no number
    // still works as a link; an invented count does not.
    console.error('Category rollup failed:', error)
  }

  const rows = CATEGORIES.map(category => {
    const count = people.get(category.name)?.size ?? 0
    const held = skillHolders.get(category.name)
    const chips = held
      ? Array.from(held.entries()).sort((a, b) => b[1] - a[1]).slice(0, CHIPS_PER_ROW).map(([name]) => name)
      : []
    return { ...category, count, chips: chips.length ? chips : category.fallback, live: chips.length > 0 }
  })

  // Busiest first, so the row somebody is most likely to want is the row they
  // read first. Ties keep the written order above.
  rows.sort((a, b) => b.count - a.count)

  return (
    <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="display-sm text-3xl sm:text-4xl mb-3">
          Browse by skill
        </h2>
        <p className="quiet">
          Tap anything to see who can do it. Everyone here can be contacted directly.
        </p>
      </div>

      <div className="border-t border-white/10">
        {rows.map(row => (
          <div
            key={row.name}
            className="group relative grid gap-2.5 sm:gap-5 sm:grid-cols-[minmax(150px,210px)_1fr_auto] sm:items-center py-5 border-b border-white/10 transition-colors"
          >
            {/* The row's own colour, washed in from the left on hover. Cheaper
                than tinting every chip and it keeps the resting state calm. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -inset-x-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(to right, ${row.tick}1f, transparent 62%)` }}
            />
            <Link
              href={`/browse?category=${encodeURIComponent(row.name)}`}
              className="relative flex items-center gap-3 font-semibold transition-colors"
              style={{ color: row.tick }}
            >
              <span
                aria-hidden
                className="w-[3px] h-[19px] rounded-full flex-none transition-all group-hover:h-[26px]"
                style={{ background: row.tick, boxShadow: `0 0 14px ${row.tick}66` }}
              />
              {row.name}
            </Link>

            <div className="flex flex-wrap gap-1.5">
              {row.chips.map(skill => (
                <Link
                  key={skill}
                  // ?search= already matches on skill name, so these need no
                  // new filter — and they are the terms people search for.
                  href={`/browse?search=${encodeURIComponent(skill)}`}
                  className="relative text-xs sm:text-[13px] rounded-full border px-2.5 py-1 text-white/75 transition-colors hover:text-white"
                  style={{ borderColor: `${row.tick}4d`, background: `${row.tick}12` }}
                >
                  {skill}
                </Link>
              ))}
            </div>

            <Link
              href={`/browse?category=${encodeURIComponent(row.name)}`}
              className="relative flex items-center gap-3 font-mono text-xs tabular-nums whitespace-nowrap text-white/45 transition-colors group-hover:text-white/70"
            >
              {/* No count rather than a zero. "0 available" is an argument for
                  leaving, and every category starts there. */}
              {row.count > 0 ? `${row.count} available` : 'Be the first'}
              <span
                aria-hidden
                className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                style={{ color: row.tick }}
              >
                &rarr;
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
