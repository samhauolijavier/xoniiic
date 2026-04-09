import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Get answers to common questions about Virtual Freaks — the free remote talent marketplace for hiring freelancers and finding remote work.',
  alternates: {
    canonical: 'https://virtualfreaks.co/faq',
  },
}

const faqs = [
  {
    question: 'What is Virtual Freaks?',
    answer:
      'Virtual Freaks is a remote talent marketplace that connects businesses with skilled virtual professionals worldwide. Whether you need a developer, designer, virtual assistant, marketer, or any other remote professional, Virtual Freaks makes it easy to find and hire the right talent.',
  },
  {
    question: 'How is Virtual Freaks different from Upwork or Fiverr?',
    answer:
      'Unlike Upwork and Fiverr, Virtual Freaks is completely free for employers — no service fees, no subscriptions, and no commissions on hires. We focus on direct connections between businesses and talent without acting as a middleman. Freelancers keep more of their earnings, and employers save on hiring costs.',
  },
  {
    question: 'How do I hire remote talent?',
    answer:
      'Simply browse our talent directory, filter by skills, category, or availability, and view detailed profiles with portfolios and reviews. When you find a great match, reach out directly through our platform to discuss your project and get started.',
  },
  {
    question: 'How do I sign up as a freelancer?',
    answer:
      'Create a free account and select the Seeker role. Build out your profile with your skills, hourly rate, portfolio, video introduction, and certifications. Your profile will be publicly listed in our talent directory so employers can discover you.',
  },
  {
    question: 'Is Virtual Freaks free?',
    answer:
      'Yes! Virtual Freaks is 100% free for employers to browse talent, view profiles, and connect with freelancers. Freelancers can create profiles and get discovered at no cost. We offer optional premium features for freelancers who want enhanced visibility and profile badges.',
  },
  {
    question: 'What types of professionals are available?',
    answer:
      'Virtual Freaks hosts professionals across dozens of categories including web development, mobile development, graphic design, UI/UX design, digital marketing, content writing, video editing, virtual assistance, bookkeeping, customer support, project management, and many more.',
  },
  {
    question: 'How does the review system work?',
    answer:
      'After working with a freelancer, employers can leave ratings and written reviews on their profile. Reviews are public and help other employers make informed hiring decisions. Freelancers build their reputation over time through positive reviews, verified badges, and portfolio work.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <JsonLd data={faqSchema} />

      {/* Hero */}
      <section className="hero-bg py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-black gradient-text mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-brand-muted max-w-2xl mx-auto">
            Everything you need to know about Virtual Freaks and how our
            remote talent marketplace works.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-brand-card border border-brand-border rounded-xl p-6 transition-colors hover:border-brand-purple/30"
            >
              <h2 className="text-lg font-bold text-brand-text mb-3 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-purple/10 text-brand-purple text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                {faq.question}
              </h2>
              <p className="text-brand-muted leading-relaxed pl-10">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-brand-card border border-brand-border rounded-xl p-8">
          <h2 className="text-2xl font-bold text-brand-text mb-3">
            Still have questions?
          </h2>
          <p className="text-brand-muted mb-6">
            We are here to help. Reach out and our team will get back to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/browse"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-purple text-white font-semibold hover:bg-brand-purple/90 transition-colors"
            >
              Browse Talent
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-brand-border text-brand-text font-semibold hover:bg-brand-card transition-colors"
            >
              Create Free Account
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
