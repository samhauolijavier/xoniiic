import { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'About Virtual Freaks — The Free Remote Talent Marketplace',
  description: 'Learn about Virtual Freaks, the modern marketplace for hiring remote talent. Free for employers, no commissions, and direct connections with skilled professionals worldwide.',
  keywords: ['about virtual freaks', 'remote talent marketplace', 'upwork alternative', 'fiverr alternative', 'hire remote workers free', 'virtual assistant marketplace'],
  alternates: {
    canonical: 'https://virtualfreaks.co/about',
  },
}

const steps = [
  {
    number: '01',
    title: 'Browse or Post',
    description: 'Explore our talent directory filtered by skills, category, and availability — or post a job to attract candidates.',
  },
  {
    number: '02',
    title: 'Connect Directly',
    description: 'Send a contact request and start a conversation. No middleman, no proposal fees, no barriers.',
  },
  {
    number: '03',
    title: 'Hire & Track',
    description: 'Mark the hire, agree on terms, and track work through the platform with built-in project management.',
  },
  {
    number: '04',
    title: 'Review & Grow',
    description: 'Leave verified reviews after completed projects. Build trust and long-term working relationships.',
  },
]

const differentiators = [
  {
    title: 'Zero Employer Fees',
    description: 'Upwork charges 5-10% marketplace fees. Fiverr charges 5.5% plus processing. We charge nothing. Browse talent, hire, and manage — completely free.',
  },
  {
    title: 'No Freelancer Commissions',
    description: 'Traditional platforms take 10-20% of freelancer earnings. On Virtual Freaks, talent keeps 100% of what they earn.',
  },
  {
    title: 'Direct Communication',
    description: 'No proposal systems or platform-mediated messaging. Connect directly with talent and discuss projects on your terms.',
  },
  {
    title: 'Verified Profiles',
    description: 'Every profile includes skills, portfolio work, hourly rates, availability status, and optional video introductions so you know exactly who you are hiring.',
  },
  {
    title: 'Transparent Reviews',
    description: 'Reviews are tied to actual completed hires — not purchased or gamed. Build and discover real reputations.',
  },
  {
    title: 'Global Talent Pool',
    description: 'Access skilled professionals from around the world across development, design, marketing, virtual assistance, and dozens more categories.',
  },
]

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Virtual Freaks',
          description: 'Virtual Freaks is a remote talent marketplace connecting businesses with skilled virtual professionals worldwide. Free for employers.',
          url: 'https://virtualfreaks.co/about',
          mainEntity: {
            '@type': 'Organization',
            name: 'Virtual Freaks',
            url: 'https://virtualfreaks.co',
            description: 'Remote talent marketplace connecting businesses with skilled virtual professionals worldwide. Free for employers with zero commissions.',
            foundingDate: '2025',
            knowsAbout: [
              'Remote Work',
              'Freelancing',
              'Virtual Assistants',
              'Talent Marketplace',
              'Remote Hiring',
            ],
          },
        }}
      />

      <div className="hero-bg">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-6">
            The Free Marketplace for Remote Talent
          </h1>
          <p className="text-lg sm:text-xl text-brand-muted max-w-3xl mx-auto leading-relaxed">
            Virtual Freaks connects businesses with skilled virtual professionals worldwide.
            No commissions. No service fees. No subscriptions. Just direct connections
            between great companies and great talent.
          </p>
        </section>

        {/* Mission */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="card p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-brand-text mb-4">Our Mission</h2>
            <p className="text-brand-muted leading-relaxed mb-4">
              The remote work revolution created incredible opportunities — but the platforms
              built to serve it charge too much, create too many barriers, and take a cut of
              every transaction. We believe hiring remote talent should be as simple as browsing
              a directory, reaching out, and getting to work.
            </p>
            <p className="text-brand-muted leading-relaxed">
              Virtual Freaks was built to be the marketplace that Upwork, Fiverr, and
              OnlineJobs.ph should have been — free for employers, fair for freelancers,
              and transparent for everyone. We are building a platform where talent speaks
              for itself, connections happen directly, and nobody takes a percentage of
              your hard-earned money.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-3xl font-bold text-brand-text text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="card p-6 relative">
                <span className="text-4xl font-black text-brand-purple/20 absolute top-4 right-4">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold text-brand-text mb-2">{step.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Virtual Freaks */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-3xl font-bold text-brand-text text-center mb-4">
            Why Virtual Freaks
          </h2>
          <p className="text-brand-muted text-center max-w-2xl mx-auto mb-12">
            Here is what makes us different from every other freelancer platform out there.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentiators.map((item) => (
              <div key={item.title} className="card p-6">
                <h3 className="text-lg font-semibold text-brand-text mb-2">{item.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="card p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-brand-text mb-8">
              A Growing Community of Remote Professionals
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Talent Categories', value: '15+' },
                { label: 'Countries Represented', value: 'Global' },
                { label: 'Employer Cost', value: '$0' },
                { label: 'Freelancer Commission', value: '0%' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-brand-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
          <h2 className="text-3xl font-bold text-brand-text mb-4">Ready to Get Started?</h2>
          <p className="text-brand-muted mb-8 max-w-xl mx-auto">
            Whether you are looking to hire world-class remote talent or showcase your skills
            to employers worldwide, Virtual Freaks is the platform for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=employer" className="btn-primary px-8 py-3 text-base">
              Hire Talent — Free
            </Link>
            <Link
              href="/register?role=seeker"
              className="px-8 py-3 text-base rounded-xl border border-brand-border text-brand-text hover:border-brand-purple transition-all text-center"
            >
              Create Your Profile
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
