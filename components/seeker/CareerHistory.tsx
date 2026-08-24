/*
 * Where somebody worked and studied.
 *
 * The part a profile here was missing against a LinkedIn page — and the reason
 * one read as a marketplace listing while the other read as a career. It is
 * placed above skills on purpose: a hiring manager scans employment history
 * first and takes the skill list as corroboration, not the other way round.
 *
 * Renders nothing when empty, like everything else on this page.
 */

function monthLabel(month: string | null): string {
  if (!month) return ''
  const [y, m] = month.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

/** "Mar 2023 — Present · 2 yrs 5 mos" */
function period(startMonth: string, endMonth: string | null, current: boolean): string {
  const start = monthLabel(startMonth)
  const end = current ? 'Present' : monthLabel(endMonth)
  if (!end) return start

  const [sy, sm] = startMonth.split('-').map(Number)
  const now = new Date()
  const [ey, em] = current
    ? [now.getFullYear(), now.getMonth() + 1]
    : (endMonth ?? '').split('-').map(Number)

  const months = (ey - sy) * 12 + (em - sm)
  if (!Number.isFinite(months) || months < 0) return `${start} — ${end}`

  const years = Math.floor(months / 12)
  const rest = months % 12
  const length = [
    years ? `${years} yr${years === 1 ? '' : 's'}` : '',
    rest ? `${rest} mo${rest === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join(' ')

  return length ? `${start} — ${end} · ${length}` : `${start} — ${end}`
}

export function CareerHistory({
  experiences,
  education,
}: {
  experiences: {
    id: string
    company: string
    role: string
    startMonth: string
    endMonth: string | null
    current: boolean
    location: string | null
    description: string | null
  }[]
  education: {
    id: string
    school: string
    degree: string | null
    field: string | null
    startYear: number | null
    endYear: number | null
    description: string | null
  }[]
}) {
  if (!experiences.length && !education.length) return null

  return (
    <>
      {experiences.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-brand-text mb-5">Experience</h2>
          <div className="space-y-5">
            {experiences.map(e => (
              <div key={e.id} className="border-l-2 border-brand-border pl-4">
                <h3 className="font-semibold text-brand-text">{e.role}</h3>
                <p className="text-sm text-brand-text">
                  {e.company}
                  {e.location && <span className="text-brand-muted"> · {e.location}</span>}
                </p>
                <p className="text-xs text-brand-muted font-mono mt-0.5">
                  {period(e.startMonth, e.endMonth, e.current)}
                </p>
                {e.description && (
                  <p className="text-sm text-brand-muted leading-relaxed mt-2 whitespace-pre-wrap">
                    {e.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-brand-text mb-5">Education</h2>
          <div className="space-y-5">
            {education.map(ed => (
              <div key={ed.id} className="border-l-2 border-brand-border pl-4">
                <h3 className="font-semibold text-brand-text">{ed.school}</h3>
                {(ed.degree || ed.field) && (
                  <p className="text-sm text-brand-text">
                    {[ed.degree, ed.field].filter(Boolean).join(', ')}
                  </p>
                )}
                {(ed.startYear || ed.endYear) && (
                  <p className="text-xs text-brand-muted font-mono mt-0.5">
                    {[ed.startYear, ed.endYear].filter(Boolean).join(' — ')}
                  </p>
                )}
                {ed.description && (
                  <p className="text-sm text-brand-muted leading-relaxed mt-2 whitespace-pre-wrap">
                    {ed.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
