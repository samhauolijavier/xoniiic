export const dynamic = "force-dynamic"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { VerifiedBadge, NewEmployerBadge } from '@/components/ui/VerifiedBadge'
import { VerifiedPartnerBadge } from '@/components/ui/VerifiedPartnerBadge'
import { VFVerifiedBadge } from '@/components/ui/VFVerifiedBadge'
import { FREE_CONTACTS_PER_MONTH, FREE_ACTIVE_JOB_POSTS } from '@/lib/stripe'
import { ActivityFeedWidget } from '@/components/ui/ActivityFeedWidget'
import { FoundingMemberBadge } from '@/components/ui/FoundingMemberBadge'
import { isMonetizationEnabled } from '@/lib/monetization'

export default async function EmployerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as { id: string; role: string; name?: string | null }
  if (user.role !== 'employer') redirect('/dashboard')

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { premium: true, premiumUntil: true, createdAt: true, foundingMemberNumber: true },
  })

  const profile = await db.employerProfile.findUnique({
    where: { userId: user.id },
    include: {
      reviewsReceived: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  })

  const isPartner = dbUser?.premium ?? false
  const verificationTier = profile?.verificationTier ?? null
  const isVFVerified = verificationTier === 'vf_verified'
  const monetizationOn = await isMonetizationEnabled()

  // Get contacts sent this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const contactsThisMonth = await db.contactRequest.count({
    where: { senderId: user.id, createdAt: { gte: startOfMonth } },
  })

  // Get active job posts
  const activeJobPosts = await db.jobNeed.count({
    where: { employerId: user.id, status: 'active' },
  })

  // Get total job posts
  const totalJobPosts = await db.jobNeed.count({
    where: { employerId: user.id },
  })

  // Get saved profiles count
  const savedCount = await db.savedProfile.count({
    where: { employerId: user.id },
  })

  // Get total contacts sent
  const totalContacts = await db.contactRequest.count({
    where: { senderId: user.id },
  })

  // Get recent contacts
  const recentContacts = await db.contactRequest.findMany({
    where: { senderId: user.id },
    include: {
      receiver: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Get active job needs
  const activeNeeds = await db.jobNeed.findMany({
    where: { employerId: user.id, status: 'active' },
    include: { _count: { select: { interests: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const isNewEmployer = profile && !profile.verified &&
    Date.now() - new Date(profile.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000

  const profileComplete = !!(profile?.companyName && profile?.description)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
              Welcome back,{' '}
              <span className="gradient-text">
                {profile?.companyName || user.name?.split(' ')[0] || 'Employer'}
              </span>
            </h1>
            {isVFVerified && <VFVerifiedBadge size="md" />}
            {isPartner && !isVFVerified && <VerifiedPartnerBadge size="md" />}
            {profile?.verified && !isPartner && !isVFVerified && <VerifiedBadge size="sm" />}
            {isNewEmployer && <NewEmployerBadge />}
            {dbUser?.foundingMemberNumber && (
              <FoundingMemberBadge number={dbUser.foundingMemberNumber} size="md" />
            )}
          </div>
          <p className="text-brand-muted mt-1">Your hiring command center</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {!isPartner && monetizationOn && (
            <Link
              href="/verified-partner"
              className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all"
            >
              🛡️ Become a Verified Partner
            </Link>
          )}
          <Link href="/employer-profile" className="btn-secondary text-sm">
            Edit Company Profile
          </Link>
        </div>
      </div>

      {/* Profile completion nudge */}
      {!profileComplete && (
        <div className="card p-5 border-amber-500/30 bg-amber-500/5 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-brand-text">Complete your company profile</p>
              <p className="text-xs text-brand-muted mt-1">
                Seekers are more likely to respond to employers with a complete profile.
              </p>
            </div>
            <Link href="/employer-profile" className="btn-primary text-sm">
              Complete Profile
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl mb-3">
            💬
          </div>
          <div className="text-2xl font-black gradient-text">{totalContacts}</div>
          <div className="text-sm text-brand-muted mt-0.5">Total Contacts Sent</div>
          {!isPartner && monetizationOn && (
            <div className="text-xs text-brand-muted mt-2 pt-2 border-t border-brand-border">
              <span className={contactsThisMonth >= FREE_CONTACTS_PER_MONTH ? 'text-red-400' : 'text-brand-text'}>
                {contactsThisMonth}/{FREE_CONTACTS_PER_MONTH}
              </span> used this month
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-xl mb-3">
            📋
          </div>
          <div className="text-2xl font-black gradient-text">{activeJobPosts}</div>
          <div className="text-sm text-brand-muted mt-0.5">Active Job Posts</div>
          {!isPartner && monetizationOn && (
            <div className="text-xs text-brand-muted mt-2 pt-2 border-t border-brand-border">
              <span className={activeJobPosts >= FREE_ACTIVE_JOB_POSTS ? 'text-red-400' : 'text-brand-text'}>
                {activeJobPosts}/{FREE_ACTIVE_JOB_POSTS}
              </span> limit
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl mb-3">
            ⭐
          </div>
          <div className="text-2xl font-black gradient-text">{savedCount}</div>
          <div className="text-sm text-brand-muted mt-0.5">Saved Talent</div>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-rose-500 flex items-center justify-center text-xl mb-3">
            📊
          </div>
          <div className="text-2xl font-black gradient-text">{totalJobPosts}</div>
          <div className="text-sm text-brand-muted mt-0.5">Total Jobs Posted</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link
          href="/browse"
          className="card p-4 text-center border-brand-purple/20 hover:border-brand-purple/50 transition-all group"
        >
          <div className="text-2xl mb-1.5">🔍</div>
          <div className="text-sm font-medium text-brand-text group-hover:gradient-text transition-all">Browse Talent</div>
        </Link>
        <Link
          href="/post-a-need"
          className="card p-4 text-center border-brand-purple/20 hover:border-brand-purple/50 transition-all group"
        >
          <div className="text-2xl mb-1.5">📝</div>
          <div className="text-sm font-medium text-brand-text group-hover:gradient-text transition-all">Post a Need</div>
        </Link>
        <Link
          href="/saved"
          className="card p-4 text-center border-brand-purple/20 hover:border-brand-purple/50 transition-all group"
        >
          <div className="text-2xl mb-1.5">⭐</div>
          <div className="text-sm font-medium text-brand-text group-hover:gradient-text transition-all">Saved Talent</div>
        </Link>
        <Link
          href="/saved-searches"
          className="card p-4 text-center border-brand-purple/20 hover:border-brand-purple/50 transition-all group"
        >
          <div className="text-2xl mb-1.5">🔔</div>
          <div className="text-sm font-medium text-brand-text group-hover:gradient-text transition-all">Saved Searches</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Job Posts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-text">Active Job Posts</h2>
            <Link href="/post-a-need" className="text-xs text-brand-purple hover:underline">
              Post new →
            </Link>
          </div>
          {activeNeeds.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-brand-muted text-sm">No active job posts</p>
              <Link href="/post-a-need" className="btn-primary text-sm mt-3 inline-flex">
                Post Your First Need
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeNeeds.map((need) => (
                <div key={need.id} className="p-4 rounded-xl bg-brand-border/30 border border-brand-border">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-medium text-brand-text text-sm truncate">{need.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 flex-shrink-0">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-muted">
                    <span>{need.category}</span>
                    <span>•</span>
                    <span>{need._count.interests} interested</span>
                    <span>•</span>
                    <span>{new Date(need.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Contacts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-text">Recent Contacts</h2>
            <Link href="/browse" className="text-xs text-brand-purple hover:underline">
              Find talent →
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-brand-muted text-sm">No contacts sent yet</p>
              <Link href="/browse" className="btn-primary text-sm mt-3 inline-flex">
                Browse Talent
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="p-4 rounded-xl bg-brand-border/30 border border-brand-border">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="font-medium text-brand-text text-sm">
                        {contact.receiver.user.name || contact.receiver.username}
                      </p>
                      <p className="text-xs text-brand-muted">@{contact.receiver.username}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        contact.status === 'pending'
                          ? 'bg-yellow-900/40 text-yellow-400'
                          : 'bg-emerald-900/40 text-emerald-400'
                      }`}>
                        {contact.status}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-brand-muted line-clamp-1">{contact.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mt-6">
        <ActivityFeedWidget />
      </div>

      {/* Partner Upsell for free employers */}
      {!isPartner && monetizationOn && (
        <div className="mt-8 card p-6 border-brand-purple/20 bg-brand-purple/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-brand-text flex items-center gap-2">
                <span>🛡️</span> Upgrade to Verified Partner
              </h3>
              <p className="text-sm text-brand-muted mt-1">
                Unlimited contacts, unlimited job posts, verified badge, and more.
              </p>
            </div>
            <Link
              href="/verified-partner"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
