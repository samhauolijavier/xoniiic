/*
 * The resource section, in the Operator direction.
 *
 * Built as a credential pipeline rather than a download page. The sample
 * Spencer sent is a workbook PDF sitting on someone's site; the difference
 * here is that finishing one produces something an employer can see — which
 * is what makes it worth 100 PHP a month and what Upwork cannot copy.
 *
 * Niche-agnostic on purpose. A track is a set of scenarios; GoHighLevel is
 * the first one, not the shape of the thing.
 */
import '../tokens.css'
import '../preview.css'
import './resources.css'

const TRACKS = [
  { name: 'Media Buying', count: 9, live: true },
  { name: 'CRM & Automation', count: 12, live: true },
  { name: 'Support & Inbox', count: 7, live: true },
  { name: 'Bookkeeping', count: 6, live: true },
  { name: 'Design', count: 5, live: false },
  { name: 'Development', count: 4, live: false },
]

const SCENARIOS = [
  {
    n: '01', title: 'Rescue a campaign that spent £400 and booked nothing',
    track: 'Media Buying', level: 'Applied', mins: 90, video: '31:18',
    brief: 'A real account export. Find where the money went before you touch a budget.',
    files: ['Workbook.pdf', 'Account-export.csv'], done: 163, badge: 'Meta — Campaign Audit',
  },
  {
    n: '02', title: 'Close a month that does not balance',
    track: 'Bookkeeping', level: 'Applied', mins: 75, video: '22:40',
    brief: 'Two accounts, one missing reconciliation, and a client who needs it by Friday.',
    files: ['Workbook.pdf', 'Ledger.xlsx'], done: 88, badge: 'Xero — Month-End Close',
  },
  {
    n: '03', title: 'Build a lead capture flow that does not double-fire',
    track: 'CRM & Automation', level: 'Foundation', mins: 45, video: '18:22',
    brief: 'The same person submits twice. Build it, then make re-entry behave.',
    files: ['Workbook.pdf', 'Snapshot.json'], done: 214, badge: 'CRM — Workflow Builder',
  },
  {
    n: '04', title: 'Take over an inbox with 400 unread and no system',
    track: 'Support & Inbox', level: 'Foundation', mins: 40, video: '15:07',
    brief: 'Triage, macro, escalate. What you do in the first hour of a new client.',
    files: ['Workbook.pdf'], done: 141, badge: 'Support — Inbox Triage',
  },
]

export default function Resources() {
  return (
    <div className="vf">
      <header className="nav">
        <div className="wrap nav-in">
          <a className="mark" href="#">Virtual&nbsp;Freaks</a>
          <nav className="nav-links">
            <a href="#">Browse talent</a><a href="#">Post a need</a>
            <a className="on" href="#">Practice</a><a href="#">Pricing</a>
          </nav>
          <div className="nav-cta">
            <a className="btn ghost" href="#">Sign in</a>
            <a className="btn" href="#">Join free</a>
          </div>
        </div>
      </header>

      {/* The pitch is the loop, stated plainly. Not "learn skills" — the
          specific thing that happens to you if you do this. */}
      <section className="wrap res-hero">
        <div>
          <p className="eyebrow">Practice · free</p>
          <h1>Do the work. Get it marked.<br /><span className="mark-accent">Wear it on your profile.</span></h1>
          <p className="lede">
            Every scenario is a real job someone paid for, with the account to practice in.
            Finish one, submit it, and a verified badge lands on your profile where employers
            filter by it. No course. No certificate mill.
          </p>
        </div>
        <ol className="loop">
          {[
            ['Watch', 'A real build, start to finish'],
            ['Download', 'Workbook, snapshot, the account export'],
            ['Practice', 'In a real account you can break'],
            ['Submit', 'We mark it by hand'],
            ['Wear it', 'Badge on your profile, filterable'],
          ].map(([t, s], i) => (
            <li key={t}><span className="step">{i + 1}</span><strong>{t}</strong><span>{s}</span></li>
          ))}
        </ol>
      </section>

      <section className="wrap tracks-bar">
        {TRACKS.map((t, i) => (
          <button key={t.name} className={`track ${i === 0 ? 'on' : ''} ${t.live ? '' : 'soon'}`}>
            {t.name}<span className="track-n">{t.live ? t.count : 'soon'}</span>
          </button>
        ))}
      </section>

      <section className="wrap scenarios">
        {SCENARIOS.map((s) => (
          <article key={s.n} className="scen">
            <div className="scen-n">{s.n}</div>
            <div className="scen-body">
              <div className="scen-top">
                <h3>{s.title}</h3>
                <span className={`lvl ${s.level === 'Applied' ? 'applied' : ''}`}>{s.level}</span>
              </div>
              <p className="scen-brief">{s.brief}</p>
              <div className="scen-meta">
                <span className="m"><em>Track</em>{s.track}</span>
                <span className="m"><em>Video</em>{s.video}</span>
                <span className="m"><em>Est.</em>{s.mins}m</span>
                <span className="m"><em>Completed</em>{s.done}</span>
              </div>
              <div className="scen-files">
                {s.files.map((f) => <a key={f} className="file" href="#">↓ {f}</a>)}
              </div>
            </div>
            <div className="scen-side">
              <div className="badge-prev">
                <span className="badge-dot" />
                <div><strong>{s.badge}</strong><span>badge on completion</span></div>
              </div>
              <a className="btn" href="#">Start scenario</a>
              <a className="btn ghost" href="#">Watch first</a>
            </div>
          </article>
        ))}
      </section>

      {/* The sandbox — one dark band, same as the homepage. */}
      <section className="band-dark band">
        <div className="wrap sandbox">
          <div>
            <h2>Practice in a real account</h2>
            <p>
              A real working account for your track, reset weekly. Build it, break it, fix it. Most people learning this have never seen the inside of a
              paid account — that is the actual barrier, and it is not the tutorials.
            </p>
            <ul className="sandbox-list">
              <li>Your own workspace, wiped every Sunday</li>
              <li>Every scenario preloaded for your track</li>
              <li>Cancel any month</li>
            </ul>
          </div>
          <div className="price">
            <div className="price-n">₱100<span>/month</span></div>
            <p className="price-sub">≈ $1.70. Priced so it is not the reason anyone stops.</p>
            <a className="btn lg" href="#">Get sandbox access</a>
            <p className="price-foot">Free scenarios stay free. This is only the account.</p>
          </div>
        </div>
      </section>

      <footer className="wrap foot">
        <span>Virtual Freaks · Practice</span>
        <span className="muted">Six tracks and counting. A track is a set of scenarios — the shape works for any craft.</span>
      </footer>
    </div>
  )
}
