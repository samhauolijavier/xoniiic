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
    place: 'Cebu, PH', tags: ['GoHighLevel', 'Zapier', 'Workflows'], jobs: 41,
    badges: 3, links: ['in', 'f'], verified: true },
  { name: 'Ana Sofía Reyes', role: 'Media Buying', years: 8, rate: 22,
    place: 'Bogotá, CO', tags: ['Meta Ads', 'Google Ads', 'Reporting'], jobs: 63,
    badges: 5, links: ['in'], verified: true },
  { name: 'Tomás Herrera', role: 'Full-Stack Development', years: 7, rate: 28,
    place: 'Buenos Aires, AR', tags: ['React', 'Node', 'Postgres'], jobs: 52,
    badges: 4, links: ['in', 'gh'], verified: true },
  { name: 'Priya Raghavan', role: 'Bookkeeping', years: 9, rate: 15,
    place: 'Kochi, IN', tags: ['Xero', 'QuickBooks', 'Month-end'], jobs: 74,
    badges: 2, links: ['in'], verified: false },
  { name: 'Jeremy Ocampo', role: 'Support & Inbox Ops', years: 0, rate: 6,
    place: 'Davao, PH', tags: ['Freshdesk', 'Zendesk', 'Escalations'], jobs: 0,
    badges: 4, links: ['f'], verified: true },
  { name: 'Lena Fischer', role: 'Brand & Product Design', years: 5, rate: 24,
    place: 'Lisbon, PT', tags: ['Figma', 'Design systems', 'Web'], jobs: 39,
    badges: 3, links: ['in', 'be'], verified: true },
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
          Asymmetric. A centered hero with three cards under it is the shape
          every template ships; this puts the claim on the left and live
          evidence on the right, so the first thing seen is the product
          working rather than a promise about it. */}
      <section className="wrap hero">
        <div className="hero-copy">
          <p className="eyebrow">Free to join · free to hire · no cut of your rate</p>
          <h1>
            Nobody hires you without experience.
            <span className="mark-accent"> Start here.</span>
          </h1>
          <p className="lede">
            Anywhere else, no reviews means no work and no work means no reviews.
            Here you prove what you can do — free scenarios, marked, with a badge that
            lands on your profile. Ten years in or none. Employers message you
            directly and take no cut.
          </p>
          <div className="hero-actions">
            <a className="btn lg" href="#">Browse talent</a>
            <a className="btn ghost lg" href="#">Post what you need</a>
          </div>
          <dl className="stats">
            <div><dt>Cost to hire</dt><dd>Free</dd></div>
            <div><dt>Our cut of your rate</dt><dd>0%</dd></div>
            <div><dt>Skill categories</dt><dd>50+</dd></div>
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
              // Every row has to be true. "Median reply under two hours" was a
              // promise made on behalf of people who have not agreed to it and
              // cannot be held to it — the fastest way to lose the credibility
              // the channel is being built to earn.
              ['Pay 10% of everything, forever', 'We take nothing from your rate'],
              ['No reviews means no work', 'Prove it with a scenario instead'],
              ['Buy connects to apply', 'Employers message you directly'],
              ['A profile they own', 'Your links, your socials, your work'],
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
                <div><dt>Experience</dt>
                  <dd>{p.years === 0 ? 'New' : <>{p.years}<span className="per">yrs</span></>}</dd></div>
                <div><dt>Hires</dt><dd>{p.jobs}</dd></div>
                <div><dt>Badges earned</dt><dd>{p.badges}</dd></div>
              </dl>

              {/* Their own links, shown plainly. Transparency is the product:
                  an employer should be able to go and look, not take our word. */}
              <div className="links">
                {p.links.map((l) => (
                  <a key={l} className="lnk" href="#">
                    {{ in: 'LinkedIn', f: 'Facebook', gh: 'GitHub', be: 'Behance' }[l]} ↗
                  </a>
                ))}
              </div>

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
