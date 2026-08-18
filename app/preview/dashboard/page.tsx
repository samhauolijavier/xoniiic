/*
 * The learner's own page.
 *
 * Three things it has to get right.
 *
 * It must be obvious that the clock covers the PRACTICE ACCOUNT and nothing
 * else. A Virtual Freaks profile is free forever — if a lapsed 100 pesos took
 * someone's profile down, the marketplace would lose exactly the people the
 * videos brought in, and employers would watch the directory empty.
 *
 * The number is always paired with a way out of it. A bare countdown is a
 * meter running, and to someone earning 8,000 pesos a month it reads as
 * pressure. Next to two free routes it reads as a choice.
 *
 * And it stays quiet until it matters. Grey at twenty days, prominent at
 * seven, a real prompt at two — because a permanent countdown gets tuned out
 * exactly when it needs to be noticed.
 */
import '../tokens.css'
import '../preview.css'
import './dashboard.css'

const DAYS_LEFT = 12

const SCENARIOS = [
  { n: '01', title: 'Rescue a campaign that spent £400 and booked nothing', state: 'passed', score: 92 },
  { n: '02', title: 'Close a month that does not balance', state: 'passed', score: 84 },
  { n: '03', title: 'Build a lead capture flow that does not double-fire', state: 'open' },
  { n: '04', title: 'Take over an inbox with 400 unread', state: 'locked' },
]

const urgency = DAYS_LEFT <= 2 ? 'now' : DAYS_LEFT <= 7 ? 'soon' : 'calm'

export default function LearnerDashboard() {
  const passed = SCENARIOS.filter((s) => s.state === 'passed').length

  return (
    <div className="vf">
      <header className="nav">
        <div className="wrap nav-in">
          <a className="mark" href="#">Virtual&nbsp;Freaks</a>
          <nav className="nav-links">
            <a href="#">My profile</a><a className="on" href="#">Practice</a>
            <a href="#">Messages</a><a href="#">Browse jobs</a>
          </nav>
          <div className="nav-cta"><span className="who">Maricel Bautista</span></div>
        </div>
      </header>

      <section className="wrap dash">
        <div className="dash-main">
          {/* Named explicitly. Nobody should ever wonder what the clock is on. */}
          <article className={`seat ${urgency}`}>
            <div className="seat-head">
              <div>
                <h2>GoHighLevel practice account</h2>
                <p className="seat-sub">Sandbox sub-account + GHL community access</p>
              </div>
              <div className="seat-days">
                <span className="n">{DAYS_LEFT}</span>
                <span className="u">days left</span>
              </div>
            </div>

            <div className="meter"><i style={{ width: `${(DAYS_LEFT / 30) * 100}%` }} /></div>

            {/* The line that stops anyone panicking about the wrong thing. */}
            <p className="seat-scope">
              This is only the practice account. <strong>Your Virtual Freaks profile, badges and
              messages are free forever</strong> and are not affected when this runs out.
            </p>

            <div className="ways">
              <div className="way">
                <div className="way-top">
                  <strong>Pass one more scenario</strong>
                  <span className="plus">+30 days</span>
                </div>
                <p>You have passed {passed} of 3. One to go — it marks itself the moment you submit.</p>
                <a className="btn sm" href="#">Open scenario 03</a>
              </div>

              <div className="way">
                <div className="way-top">
                  <strong>Bring two people</strong>
                  <span className="plus">+30 days</span>
                </div>
                <p>1 of 2 so far. Counts when their seat starts, not when they sign up.</p>
                <div className="ref-row">
                  <code>virtualfreaks.co/j/maricel-b</code>
                  <button className="btn ghost sm">Copy</button>
                </div>
              </div>

              <div className="way quiet">
                <div className="way-top">
                  <strong>Top up</strong>
                  <span className="plus">₱100 · 30 days</span>
                </div>
                <p>GCash. One payment, no subscription — nothing renews by itself.</p>
                <a className="btn ghost sm" href="#">Top up</a>
              </div>
            </div>
          </article>

          <article className="card-block">
            <div className="block-head"><h2>Scenarios</h2>
              <span className="hint">Free, always. Passing three buys another 30 days.</span></div>
            {SCENARIOS.map((s) => (
              <div key={s.n} className={`scen-row ${s.state}`}>
                <span className="scen-num">{s.n}</span>
                <span className="scen-title">{s.title}</span>
                {s.state === 'passed' && <span className="chip good">passed · {s.score}%</span>}
                {s.state === 'open' && <a className="btn sm" href="#">Start</a>}
                {s.state === 'locked' && <span className="chip">after 03</span>}
              </div>
            ))}
          </article>
        </div>

        <aside className="dash-side">
          <div className="card-block">
            <div className="block-head"><h2>Badges</h2></div>
            <div className="badge-row"><span className="badge-dot" />
              <div><strong>Meta — Campaign Audit</strong><span>earned 2 Aug</span></div></div>
            <div className="badge-row"><span className="badge-dot" />
              <div><strong>Xero — Month-End Close</strong><span>earned 9 Aug</span></div></div>
            <p className="hint pad">These sit on your public profile. Employers filter by them.</p>
          </div>

          <div className="card-block">
            <div className="block-head"><h2>Your profile</h2></div>
            <p className="hint pad">
              Free forever. Nothing here expires — not your profile, not your badges, not your
              messages.
            </p>
            <a className="btn ghost sm" href="#">View public profile ↗</a>
          </div>
        </aside>
      </section>

      <footer className="wrap foot">
        <span>Virtual Freaks</span>
        <span className="muted">The practice account has a clock. Your place here does not.</span>
      </footer>
    </div>
  )
}
