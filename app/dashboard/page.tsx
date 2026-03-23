export const dynamic = "force-dynamic"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { getCompletionScore } from '@/lib/completionScore'
import { ShareProfileLink } from '@/components/seeker/ShareProfileLink'
import { PremiumBadge } from '@/components/ui/PremiumBadge'
import { FoundingMemberBadge } from '@/components/ui/FoundingMemberBadge'
import { WhoViewedSection } from './WhoViewedSection'
import { AnalyticsSection } from './AnalyticsSection'
import { ActivityFeedWidget } from '@/components/ui/ActivityFeedWidget'
import { isMonetizationEnabled } from '@/lib/monetization'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as { id: string; role: string; name?: string | null }

  if (user.role === 'employer') redirect('/employer-dashboard')
  if (user.role === 'admin') redirect('/admin')

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { premium: true, premiumUntil: true, foundingMemberNumber: true },
  })

  const profile = await db.seekerProfile.findUnique({
    where: { userId: user.id },
    include: {
      skills: { include: { skill: true }, orderBy: { rating: 'desc' } },
      contactsReceived: {
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      savedBy: true,
      portfolioLinks: true,
      certificates: true,
    },
  })

  if (!profile) redirect('/profile/edit')

  const isPremium = dbUser?.premium ?? false
  const monetizationOn = await isMonetizationEnabled()
  const completion = getCompletionScore(profile)

  const stats = [
    { label: 'Profile Views', value: profile.profileViews, icon: '👁', color: 'from-blue-600 to-purple-600' },
    { label: 'Contact Requests', value: profile.contactsReceived.length, icon: '💌', color: 'from-pink-600 to-rose-500' },
    { label: 'Saved by', value: profile.savedBy.length, icon: '🔖', color: 'from-amber-500 to-orange-500' },
    { label: 'Skills Listed', value: profile.skills.length, icon: '⚡', color: 'from-emerald-600 to-teal-500' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
              Welcome back,{' '}
              <span className="gradient-text">{user.name?.split(' ')[0] || 'Freelancer'}</span>
            </h1>
            {isPremium && <PremiumBadge size="md" />}
            {dbUser?.foundingMemberNumber && (
              <FoundingMemberBadge number={dbUser.foundingMemberNumber} size="md" />
            )}
          </div>
          <p className="text-brand-muted mt-1">
            Here&apos;s how your profile is performing
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {!isPremium && monetizationOn && (
            <Link href="/premium" className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:opacity-90 transition-all">
              ★ Upgrade to Premium
            </Link>
          )}
          <Link href={`/talent/${profile.username}`} className="btn-secondary text-sm">
            View Profile
          </Link>
          <Link href="/profile/edit" className="btn-primary text-sm">
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Profile Completion Meter */}
      <div className="card p-6 mb-8 border-brand-purple/30 bg-brand-purple/5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-brand-text text-lg">Profile Strength</h3>
            <p className="text-sm text-brand-muted mt-0.5">Complete your profile to get more employer views</p>
          </div>
          <div className={`text-3xl font-black ${
            completion.color === 'green' ? 'text-emerald-400' :
            completion.color === 'orange' ? 'text-amber-400' :
            'text-red-400'
          }`}>
            {completion.score}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-brand-border rounded-full h-3 mb-5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completion.color === 'green' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
              completion.color === 'orange' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
              'bg-gradient-to-r from-red-600 to-red-400'
            }`}
            style={{ width: `${completion.score}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {completion.items.map((item) => (
            <div key={item.key} className="flex items-center gap-2.5 text-sm">
              {item.done ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">✓</span>
              ) : (
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs flex-shrink-0">✕</span>
              )}
              {item.done ? (
                <span className="text-brand-muted line-through">{item.label}</span>
              ) : (
                <Link
                  href={`/profile/edit${item.editTab ? `?tab=${item.editTab}` : ''}`}
                  className="text-brand-text hover:text-brand-purple transition-colors"
                >
                  {item.label}
                  <span className="ml-1 text-xs text-brand-muted">(+{item.points}%)</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-black gradient-text">{stat.value}</div>
            <div className="text-sm text-brand-muted mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Who Viewed Your Profile */}
      <WhoViewedSection isPremium={isPremium} hideMonetization={!monetizationOn} />

      {/* Analytics Section */}
      <AnalyticsSection isPremium={isPremium} hideMonetization={!monetizationOn} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Requests */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Contact Requests</h2>
          {profile.contactsReceived.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-brand-muted text-sm">No contact requests yet</p>
              <p className="text-brand-muted text-xs mt-1">Keep your profile updated to attract employers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.contactsReceived.map((contact) => (
                <div key={contact.id} className="p-4 rounded-xl bg-brand-border/30 border border-brand-border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-brand-text text-sm">
                        {contact.sender.name || 'Employer'}
                      </p>
                      <p className="text-xs text-brand-muted">{contact.senderEmail}</p>
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
                  <p className="text-sm text-brand-muted line-clamp-2">{contact.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Skills */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-text">Your Skills</h2>
            <Link href="/profile/edit" className="text-xs text-brand-purple hover:underline">
              Edit skills
            </Link>
          </div>
          {profile.skills.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-brand-muted text-sm">No skills added yet</p>
              <Link href="/profile/edit" className="btn-primary text-sm mt-3 inline-flex">
                Add Skills
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.skills.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-sm text-brand-text w-20 sm:w-28 flex-shrink-0 truncate">{s.skill.name}</span>
                  <div className="flex-1 bg-brand-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-purple to-brand-orange rounded-full"
                      style={{ width: `${(s.rating / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-brand-muted w-8 text-right">{s.rating}/10</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Status + Share */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Badge status={profile.availability} />
              <span className="text-sm text-brand-muted">
                Public profile: virtualfreaks.com/talent/{profile.username}
              </span>
            </div>
            <Link href={`/talent/${profile.username}`} className="text-sm text-brand-purple hover:underline" target="_blank">
              View as employer →
            </Link>
          </div>
        </div>
        <ShareProfileLink username={profile.username} />
      </div>

      {/* Activity Feed */}
      <div className="mt-6">
        <ActivityFeedWidget />
      </div>
    </div>
  )
}
