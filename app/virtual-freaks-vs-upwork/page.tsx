import { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Virtual Freaks vs Upwork — Free Alternative to Upwork',
  description: 'Compare Virtual Freaks and Upwork. See why businesses are choosing Virtual Freaks as a free alternative with zero commissions, direct communication, and verified talent profiles.',
  keywords: [
    'virtual freaks vs upwork', 'upwork alternative', 'free upwork alternative',
    'hire freelancers free', 'no commission freelancer platform', 'upwork fees',
    'upwork competitor', 'best freelancer marketplace',
  ],
  alternates: {
    canonical: 'https://virtualfreaks.co/virtual-freaks-vs-upwork',
  },
}

const comparisonRows = [
  { feature: 'Employer Fees', vf: 'Free — $0', upwork: '5-10% marketplace fee' },
  { feature: 'Freelancer Commission', vf: '0% — keep everything', upwork: '10% on all earnings' },
  { feature: 'Monthly Subscription', vf: 'None required', upwork: '$49.99/mo for Plus plan' },
  { feature: 'Proposal/Connect Fees', vf: 'None — browse freely', upwork: 'Freelancers pay per proposal' },
  { feature: 'Direct Messaging', vf: 'Yes — contact talent directly', upwork: 'Only after hiring or proposal' },
  { feature: 'Video Introductions', vf: 'Built into profiles', upwork: 'Not standard' },
  { feature: 'Talent Profiles', vf: 'Portfolio, skills, rates, video', upwork: 'Portfolio, skills, tests' },
  { feature: 'Review System', vf: 'Verified hire-based reviews', upwork: 'Contract-based reviews' },
  { feature: 'Job Board', vf: 'Yes — free to post', upwork: 'Yes — charges apply' },
  { feature: 'Payment Processing', vf: 'Direct between parties', upwork: 'Through Upwork (fees apply)' },
  { feature: 'Talent Pool', vf: 'Growing global community', upwork: 'Large established pool' },
  { feature: 'Platform Age', vf: 'Launched 2025', upwork: 'Founded 2015 (as Upwork)' },
]

export default function VsUpworkPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Virtual Freaks vs Upwork Comparison',
          description: 'A detailed comparison between Virtual Freaks and Upwork freelancer marketplaces.',
          url: 'https://virtualfreaks.co/virtual-freaks-vs-upwork',
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is Virtual Freaks a free alternative to Upwork?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Virtual Freaks is completely free for employers — no marketplace fees, no subscriptions, and no commissions. Upwork charges employers 5-10% marketplace fees and freelancers 10% on all earnings.',
              },
            },
            {
              '@type': 'Question',
              name: 'How much does Upwork charge compared to Virtual Freaks?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Upwork charges employers a 5-10% marketplace fee, freelancers a 10% commission, and offers a $49.99/month Plus subscription. Virtual Freaks charges $0 to employers and takes 0% commission from freelancers.',
              },
            },
            {
              '@type': 'Question',
              name: 'Why should I use Virtual Freaks instead of Upwork?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Virtual Freaks offers zero fees for employers, zero commissions for freelancers, direct messaging with talent, video introductions on profiles, and verified hire-based reviews. It is designed for businesses that want a simpler, more transparent hiring experience.',
              },
            },
          ],
        }}
      />

      <div className="hero-bg">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-brand-text mb-6">
            Virtual Freaks vs Upwork:<br />
            <span className="gradient-text">Which Platform is Right for You?</span>
          </h1>
          <p className="text-lg text-brand-muted max-w-3xl mx-auto leading-relaxed">
            Both platforms connect businesses with remote talent. But one charges thousands
            in fees — and the other is completely free. Here is a detailed comparison to
            help you decide.
          </p>
        </section>

        {/* Key Difference Callout */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="card p-8 border-brand-purple/30 text-center">
            <h2 className="text-xl font-bold text-brand-text mb-3">The Bottom Line</h2>
            <p className="text-brand-muted max-w-2xl mx-auto">
              If you hire a freelancer at <span className="text-brand-text font-semibold">$25/hour for 20 hours/week</span>,
              Upwork&apos;s fees cost you an extra <span className="text-red-400 font-semibold">$100-200/month</span>.
              On Virtual Freaks, that same hire costs <span className="text-emerald-400 font-semibold">$0 in platform fees</span>.
              Over a year, that&apos;s <span className="text-emerald-400 font-semibold">$1,200-2,400 saved</span>.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-2xl font-bold text-brand-text text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left p-4 text-sm font-semibold text-brand-muted">Feature</th>
                    <th className="text-left p-4 text-sm font-semibold text-brand-purple">Virtual Freaks</th>
                    <th className="text-left p-4 text-sm font-semibold text-brand-muted">Upwork</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-brand-border/10' : ''}>
                      <td className="p-4 text-sm font-medium text-brand-text">{row.feature}</td>
                      <td className="p-4 text-sm text-emerald-400">{row.vf}</td>
                      <td className="p-4 text-sm text-brand-muted">{row.upwork}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Who Should Use What */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-8">
              <h2 className="text-xl font-bold text-brand-purple mb-4">
                Choose Virtual Freaks if you...
              </h2>
              <ul className="space-y-3">
                {[
                  'Want to hire remote talent without paying platform fees',
                  'Prefer browsing profiles directly instead of posting and waiting',
                  'Value transparent, hire-verified reviews',
                  'Want direct communication with talent from day one',
                  'Are building a long-term remote team',
                  'Want freelancers to keep 100% of their pay',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-brand-muted">
                    <span className="text-emerald-400 mt-0.5 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-8">
              <h2 className="text-xl font-bold text-brand-muted mb-4">
                Consider Upwork if you...
              </h2>
              <ul className="space-y-3">
                {[
                  'Need access to a very large, established talent pool',
                  'Want built-in escrow and payment protection',
                  'Prefer a proposal-based hiring process',
                  'Need time tracking with screenshot monitoring',
                  'Are comfortable paying 5-10% marketplace fees',
                  'Need enterprise-level compliance features',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-brand-muted">
                    <span className="text-brand-muted/50 mt-0.5 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Deep Dive Sections */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
          <div className="card p-8">
            <h2 className="text-xl font-bold text-brand-text mb-3">Understanding Upwork Fees</h2>
            <p className="text-brand-muted leading-relaxed mb-3">
              Upwork charges employers a marketplace fee ranging from 5% to 10% on top of what you
              pay the freelancer. For freelancers, Upwork takes a flat 10% commission on all earnings.
              Additionally, Upwork sells &quot;Connects&quot; that freelancers must purchase to submit
              proposals — meaning talent pays just to apply for work.
            </p>
            <p className="text-brand-muted leading-relaxed">
              Upwork also offers a &quot;Freelancer Plus&quot; plan at $14.99/month and an
              &quot;Upwork Business&quot; plan starting at $49.99/month for teams. These fees add up
              quickly, especially for small businesses and startups hiring their first remote team members.
            </p>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-brand-text mb-3">The Virtual Freaks Approach</h2>
            <p className="text-brand-muted leading-relaxed mb-3">
              Virtual Freaks takes a fundamentally different approach. Employers pay nothing — no
              marketplace fees, no subscriptions, and no per-hire costs. Freelancers keep 100% of
              their earnings with zero commission. The platform makes money through optional premium
              features, not by taking a cut of every transaction.
            </p>
            <p className="text-brand-muted leading-relaxed">
              This means a freelancer earning $50/hour on Virtual Freaks keeps $50/hour. On Upwork,
              that same freelancer would take home $45/hour after the 10% cut. Over a year of full-time
              work, that is over $10,000 in savings for the freelancer alone.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
          <h2 className="text-3xl font-bold text-brand-text mb-4">
            Ready to Try the Free Alternative?
          </h2>
          <p className="text-brand-muted mb-8 max-w-xl mx-auto">
            Join Virtual Freaks and start hiring remote talent without paying platform fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=employer" className="btn-primary px-8 py-3 text-base">
              Start Hiring — Free
            </Link>
            <Link
              href="/browse"
              className="px-8 py-3 text-base rounded-xl border border-brand-border text-brand-text hover:border-brand-purple transition-all text-center"
            >
              Browse Talent
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
