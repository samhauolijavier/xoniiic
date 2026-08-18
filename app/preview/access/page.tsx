/*
 * The seat desk — what a VA opens each morning.
 *
 * Spencer has VAs who can run this now and wants a system rather than a
 * habit. So the whole job is one screen: claims waiting, seats about to
 * lapse, and the four ways in. No hunting through GCash, no spreadsheet.
 *
 * Manual by choice. Automatic GCash reconciliation needs a business account
 * he does not have yet, and confirming a reference number takes about fifteen
 * seconds. The queue IS the system until volume argues otherwise — and it is
 * the version that can start on Monday.
 */
import '../tokens.css'
import '../preview.css'
import './access.css'

const CLAIMS = [
  { name: 'Rowena Castillo', ref: '8842 1907 3355', amount: 100, when: '4m ago',
    proof: true, email: 'rowena.c@gmail.com', track: 'Bookkeeping', repeat: false },
  { name: 'Jomar Delos Reyes', ref: '8841 7742 0918', amount: 100, when: '22m ago',
    proof: true, email: 'jomardr@gmail.com', track: 'CRM & Automation', repeat: true },
  { name: 'Karen Villanueva', ref: '8840 2251 7734', amount: 100, when: '1h ago',
    proof: false, email: 'kvillanueva@gmail.com', track: 'Support & Inbox', repeat: false },
]

// Auto-marked, so these are already granted by the time anyone opens this
// screen. Shown so a VA can see it happening, not so they can approve it.
const EXTENDED = [
  { name: 'Alvin Mercado', scores: [92, 88, 100], track: 'Media Buying', when: '12m ago' },
  { name: 'Grace Bonifacio', scores: [76, 84, 90], track: 'Bookkeeping', when: 'yesterday' },
]

const LAPSING = [
  { name: 'Miguel Santos', days: 2, source: 'paid', sub: 'VF-Learners-01' },
  { name: 'Chelsea Ramos', days: 4, source: 'sponsored', sub: 'VF-Learners-01' },
  { name: 'Dennis Aquino', days: 6, source: 'earned', sub: 'VF-Learners-02' },
]

export default function AccessDesk() {
  return (
    <div className="vf">
      <header className="nav">
        <div className="wrap nav-in">
          <a className="mark" href="#">Virtual&nbsp;Freaks</a>
          <nav className="nav-links"><a href="#">Admin</a><a className="on" href="#">Seat desk</a><a href="#">Resources</a></nav>
          <div className="nav-cta"><span className="who">Signed in as a VA</span></div>
        </div>
      </header>

      <section className="wrap desk-head">
        <div>
          <h1>Seat desk</h1>
          <p className="lede sm">Everything waiting on a person, in one place.</p>
        </div>
        <dl className="stats">
          <div><dt>Seats in use</dt><dd>38<span className="per">/50</span></dd></div>
          <div><dt>Waiting on you</dt><dd>3</dd></div>
          <div><dt>Referral links live</dt><dd>112</dd></div>
          <div><dt>Lapsing this week</dt><dd>3</dd></div>
        </dl>
      </section>

      {/* Claims — the only part that must be done today. */}
      <section className="wrap block">
        <div className="block-head">
          <h2>GCash claims</h2>
          <span className="hint">Check the reference in GCash, then approve. 30 days starts on approval.</span>
        </div>

        {CLAIMS.map((c) => (
          <article key={c.ref} className="claim">
            <div className="claim-who">
              <div className="avatar" aria-hidden>{c.name.split(' ').map((w) => w[0]).join('')}</div>
              <div>
                <div className="row-top">
                  <strong>{c.name}</strong>
                  {c.repeat && <span className="chip">Returning</span>}
                  {!c.proof && <span className="chip warn">No screenshot</span>}
                </div>
                <div className="row-sub">{c.email} · wants {c.track}</div>
              </div>
            </div>

            <dl className="facts tight">
              <div><dt>Reference</dt><dd className="ref">{c.ref}</dd></div>
              <div><dt>Amount</dt><dd>₱{c.amount}</dd></div>
              <div><dt>Claimed</dt><dd>{c.when}</dd></div>
            </dl>

            <div className="claim-acts">
              {c.proof
                ? <a className="btn ghost sm" href="#">View screenshot</a>
                : <a className="btn ghost sm dim" href="#">Ask for proof</a>}
              <a className="btn sm" href="#">Approve · 30 days</a>
              <a className="btn ghost sm" href="#">Reject</a>
            </div>
          </article>
        ))}
      </section>

      {/* Extensions — already granted. The quizzes mark themselves, which is
          the whole reason this route can scale past what a VA could check. */}
      <section className="wrap block">
        <div className="block-head">
          <h2>Earned another 30 days</h2>
          <span className="hint">Three scenarios passed. Marked automatically and already granted — nothing to do.</span>
        </div>
        {EXTENDED.map((e) => (
          <article key={e.name} className="claim slim done">
            <div className="claim-who">
              <div className="avatar" aria-hidden>{e.name.split(' ').map((w) => w[0]).join('')}</div>
              <div>
                <div className="row-top">
                  <strong>{e.name}</strong>
                  <span className="chip good">+30 days</span>
                </div>
                <div className="row-sub">
                  {e.track} · scored {e.scores.join(', ')} · {e.when}
                </div>
              </div>
            </div>
            <div className="claim-acts">
              <a className="btn ghost sm" href="#">See answers</a>
            </div>
          </article>
        ))}
      </section>

      <section className="wrap two-up">
        <div className="block">
          <div className="block-head"><h2>Lapsing soon</h2></div>
          {LAPSING.map((l) => (
            <div key={l.name} className="lapse">
              <span className="lapse-name">{l.name}</span>
              <span className={`src ${l.source}`}>{l.source}</span>
              <span className="mono dim">{l.sub}</span>
              <span className="days">{l.days}d</span>
              <a className="btn ghost sm" href="#">Remind</a>
            </div>
          ))}
          <p className="hint pad">
            Nothing renews by itself. Nobody is ever charged for a month they forgot about —
            which matters more at ₱100 than it would at any other price.
          </p>
        </div>

        <div className="block">
          <div className="block-head"><h2>Seats someone else paid for</h2></div>
          <div className="sponsor">
            <div className="row-top"><strong>Northwind Agency</strong><span className="chip">Agency</span></div>
            <div className="bar"><i style={{ width: '60%' }} /></div>
            <div className="row-sub">6 of 10 used · “anyone on the bookkeeping track”</div>
          </div>
          <div className="sponsor">
            <div className="row-top"><strong>Ramon Cruz</strong><span className="chip">Individual</span></div>
            <div className="bar"><i style={{ width: '50%' }} /></div>
            <div className="row-sub">1 of 2 used · for a named friend</div>
          </div>
          <div className="sponsor">
            <div className="row-top"><strong>Anonymous</strong><span className="chip">Individual</span></div>
            <div className="bar"><i style={{ width: '100%' }} /></div>
            <div className="row-sub">3 of 3 used · “whoever needs it”</div>
          </div>
          <p className="hint pad">
            Anyone can fund a seat — an agency buying ten, or one person covering a friend.
            The sponsor never has to know who ends up in it, and can stay unnamed.
          </p>
        </div>
      </section>

      <footer className="wrap foot">
        <span>Seat desk</span>
        <span className="muted">Everyone pays to start. Extra time is earned, referred, or given by someone else.</span>
      </footer>
    </div>
  )
}
