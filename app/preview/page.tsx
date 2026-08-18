/*
 * A live proof of the Operator direction, on the two pages that decide
 * whether a visitor signs up: the landing hero and the browse grid.
 *
 * Self-contained on purpose — no database, no auth, no env. It renders from
 * a fixed set of people so it can be looked at, argued with, and changed
 * before any of it touches the real pages.
 */
import './tokens.css'
import './preview.css'

const PEOPLE = [
  { name: 'Maricel Bautista', role: 'CRM & Automation', years: 6, rate: 12,
    place: 'Cebu, PH', tags: ['GoHighLevel', 'Zapier', 'Workflows'], jobs: 41, reply: '2h', verified: true },
  { name: 'Ana Sofía Reyes', role: 'Media Buying', years: 8, rate: 22,
    place: 'Bogotá, CO', tags: ['Meta Ads', 'Google Ads', 'Reporting'], jobs: 63, reply: '4h', verified: true },
  { name: 'Tomás Herrera', role: 'Full-Stack Development', years: 7, rate: 28,
    place: 'Buenos Aires, AR', tags: ['React', 'Node', 'Postgres'], jobs: 52, reply: '3h', verified: true },
  { name: 'Priya Raghavan', role: 'Bookkeeping', years: 9, rate: 15,
    place: 'Kochi, IN', tags: ['Xero', 'QuickBooks', 'Month-end'], jobs: 74, reply: '5h', verified: false },
  { name: 'Jeremy Ocampo', role: 'Support & Inbox Ops', years: 4, rate: 9,
    place: 'Davao, PH', tags: ['Freshdesk', 'Zendesk', 'Escalations'], jobs: 28, reply: '1h', verified: true },
  { name: 'Lena Fischer', role: 'Brand & Product Design', years: 5, rate: 24,
    place: 'Lisbon, PT', tags: ['Figma', 'Design systems', 'Web'], jobs: 39, reply: '2h', verified: true },
]

export default function Preview() {
  return (
    <div className="vf">
      {/* ── Nav ─────────────────────────────────────────────────────────
          A rule, not a shadow. Nothing floats. */}
      <header className="nav">
        <div className="wrap nav-in">
          <a className="mark" href="#">Virtual&nbsp;Freaks</a>
          <nav className="nav-links">
            <a href="#">Browse talent</a>
            <a href="#">Post a need</a>
            <a href="#">Pricing</a>
            <a href="#">vs Upwork</a>
          </nav>
          <div className="nav-cta">
            <a className="btn ghost" href="#">Sign in</a>
            <a className="btn" href="#">Join free</a>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────
          Asymmetric. A centred hero with three cards under it is the shape
          every template ships; this puts the claim on the left and live
          evidence on the right, so the first thing seen is the product
          working rather than a promise about it. */}
      <section className="wrap hero">
        <div className="hero-copy">
          <p className="eyebrow">Operators, not gig workers</p>
          <h1>
            Hire someone who has
            <span className="mark-accent"> actually run it before.</span>
          </h1>
          <p className="lede">
            Development, design, media buying, bookkeeping, support, CRM and automation —
            every profile is someone doing the work now, not looking for their first
            job. No proposals to sift. No bidding war. You see the history and the
            rate before you say hello.
          </p>
          <div className="hero-actions">
            <a className="btn lg" href="#">Browse talent</a>
            <a className="btn ghost lg" href="#">Post what you need</a>
          </div>
          <dl className="stats">
            <div><dt>Operators listed</dt><dd>1,284</dd></div>
            <div><dt>Median reply</dt><dd>2h</dd></div>
            <div><dt>Placement fee</dt><dd>0%</dd></div>
          </dl>
        </div>

        <aside className="hero-panel">
          <div className="panel-head">
            <span className="dot" /> Live · matching on <em>“month-end close, Xero”</em>
          </div>
          {[PEOPLE[3], PEOPLE[1], PEOPLE[0]].map((p) => (
            <article key={p.name} className="row">
              <div className="avatar" aria-hidden>{p.name.split(' ').map((w) => w[0]).join('')}</div>
              <div className="row-main">
                <div className="row-top">
                  <strong>{p.name}</strong>
                  {p.verified && <span className="chip">Verified</span>}
                </div>
                <div className="row-sub">{p.role} · {p.place}</div>
              </div>
              <div className="row-num">
                <span className="rate">${p.rate}</span>
                <span className="per">/hr</span>
              </div>
            </article>
          ))}
          <div className="panel-foot">
            <span>Ranked by fit, not by who paid to be here.</span>
          </div>
        </aside>
      </section>

      {/* ── The dark band — direction C, used once ─────────────────────── */}
      <section className="band-dark band">
        <div className="wrap band-in">
          <h2>What Upwork makes you do, and we don’t</h2>
          <div className="compare">
            {[
              ['Sift 40 proposals', 'See 4 people who fit, with reasons'],
              ['Pay 10% forever', 'Pay nothing per hire'],
              ['Guess at real skill', 'Verified work history on the profile'],
              ['Wait days for replies', 'Median reply under two hours'],
            ].map(([a, b]) => (
              <div className="compare-row" key={a}>
                <span className="was">{a}</span>
                <span className="arrow" aria-hidden>→</span>
                <span className="is">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse grid ─────────────────────────────────────────────────
          The page ads land on. Dense, scannable, monospaced numbers —
          it should feel like a system returning results. */}
      <section className="wrap browse">
        <div className="browse-head">
          <h2>Browse operators</h2>
          <div className="filters">
            {['All', 'GoHighLevel', 'Support', 'Media buying', 'Funnels'].map((f, i) => (
              <button key={f} className={`pill ${i === 1 ? 'on' : ''}`}>{f}</button>
            ))}
            <span className="count">1,284 results</span>
          </div>
        </div>

        <div className="grid">
          {PEOPLE.map((p) => (
            <article key={p.name} className="card">
              <div className="card-head">
                <div className="avatar lg" aria-hidden>{p.name.split(' ').map((w) => w[0]).join('')}</div>
                <div>
                  <div className="row-top">
                    <strong>{p.name}</strong>
                    {p.verified && <span className="chip">Verified</span>}
                  </div>
                  <div className="row-sub">{p.role}</div>
                  <div className="row-sub muted">{p.place}</div>
                </div>
              </div>

              <ul className="tags">
                {p.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>

              <dl className="facts">
                <div><dt>Rate</dt><dd>${p.rate}<span className="per">/hr</span></dd></div>
                <div><dt>Experience</dt><dd>{p.years}<span className="per">yrs</span></dd></div>
                <div><dt>Hires</dt><dd>{p.jobs}</dd></div>
                <div><dt>Replies in</dt><dd>{p.reply}</dd></div>
              </dl>

              <div className="card-foot">
                <a className="btn sm" href="#">View profile</a>
                <a className="btn ghost sm" href="#">Message</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="wrap foot">
        <span>Virtual Freaks</span>
        <span className="muted">Operator — light ground, one accent, data set in mono.</span>
      </footer>
    </div>
  )
}
