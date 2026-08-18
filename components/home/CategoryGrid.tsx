/*
 * Browse by category.
 *
 * This used to be six emoji sitting in rounded gradient tiles, each a different
 * unrelated hue — blue, pink, teal, amber, red, indigo. That exact treatment is
 * on every generated landing page of the last two years and is recognisable on
 * sight. It also fought the brand: six rainbow tiles beside a fuchsia mark
 * means the page has no colour of its own.
 *
 * Typography carries it instead. A category is a word and a number, and both
 * are more useful than a picture of a wrench. The number is set in monospace
 * because it is data, and it is counted from the database now rather than typed
 * in — the old counts were hardcoded and drifted from the truth the moment
 * anybody added a skill.
 */
import Link from 'next/link'
import { db, withRetry } from '@/lib/db'

const CATEGORIES = [
  { name: 'Development', description: 'React, Node.js, Python, full-stack' },
  { name: 'Design', description: 'Figma, UI/UX, branding, video' },
  { name: 'Virtual Assistant', description: 'Admin, customer support, research' },
  { name: 'Writing', description: 'Copywriting, SEO, blog, technical' },
  { name: 'Marketing', description: 'Ads, SEO, social media, analytics' },
  { name: 'Other', description: 'Finance, HR, teaching, translation' },
]

export async function CategoryGrid() {
  let counts: Record<string, number> = {}
  try {
    const grouped = await withRetry(() => db.skill.groupBy({
      by: ['category'],
      where: { active: true },
      _count: { _all: true },
    }))
    counts = Object.fromEntries(grouped.map(g => [g.category, g._count._all]))
  } catch (error) {
    // A category with no number still works as a link. An invented count is
    // worse than no count.
    console.error('Category counts failed:', error)
  }

  return (
    <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-2">
          Browse by category
        </h2>
        <p className="text-brand-muted">
          Six areas, one directory. Everyone here can be contacted directly.
        </p>
      </div>

      {/* One-pixel gaps over a border, so the grid reads as a single ruled
          object rather than six floating cards with six drop shadows. */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border border border-brand-border rounded-xl overflow-hidden">
        {CATEGORIES.map(category => {
          const count = counts[category.name]
          return (
            <Link
              key={category.name}
              href={`/browse?category=${encodeURIComponent(category.name)}`}
              className="group bg-brand-card p-5 transition-colors hover:bg-brand-purple/[0.04]"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <h3 className="font-semibold text-brand-text group-hover:text-brand-purple transition-colors">
                  {category.name}
                </h3>
                {typeof count === 'number' && count > 0 && (
                  <span className="font-mono text-xs text-brand-muted tabular-nums">
                    {count}
                  </span>
                )}
              </div>
              <p className="text-sm text-brand-muted leading-relaxed">
                {category.description}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
