import Link from 'next/link'

export default function PremiumSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="card p-10 border-amber-500/30 bg-amber-500/5">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-black text-brand-text mb-3">
          Welcome to{' '}
          <span className="gradient-text">Premium!</span>
        </h1>
        <p className="text-brand-muted text-lg mb-2">
          Your premium features are now active.
        </p>
        <p className="text-brand-muted text-sm mb-8">
          You can now see who viewed your profile, access full analytics, and your premium badge is live.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="btn-primary justify-center">
            Go to Dashboard
          </Link>
          <Link href="/profile/edit" className="btn-secondary justify-center">
            Complete Your Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
