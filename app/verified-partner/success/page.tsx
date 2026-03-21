import Link from 'next/link'

export default function VerifiedPartnerSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="card p-10 border-brand-purple/30 bg-brand-purple/5">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange mb-6">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-brand-text mb-3">
          Welcome, <span className="gradient-text">Verified Partner!</span>
        </h1>

        <p className="text-brand-muted mb-8 max-w-md mx-auto">
          You now have unlimited contacts, unlimited job posts, and a verified badge
          that tells seekers you&apos;re the real deal.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-xs text-brand-muted">Unlimited Contacts</div>
          </div>
          <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
            <div className="text-2xl mb-1">📋</div>
            <div className="text-xs text-brand-muted">Unlimited Job Posts</div>
          </div>
          <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
            <div className="text-2xl mb-1">🛡️</div>
            <div className="text-xs text-brand-muted">Verified Badge</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/browse" className="btn-primary">
            Browse Talent Now
          </Link>
          <Link href="/post-a-need" className="btn-secondary">
            Post a Job Need
          </Link>
          <Link href="/employer-profile" className="btn-secondary">
            Complete Company Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
