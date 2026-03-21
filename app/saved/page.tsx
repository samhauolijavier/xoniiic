import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProfileCard } from '@/components/seeker/ProfileCard'
import Link from 'next/link'

export default async function SavedPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as { id: string; role: string }

  const savedProfiles = await db.savedProfile.findMany({
    where: { employerId: user.id },
    include: {
      profile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          skills: { include: { skill: true }, orderBy: { rating: 'desc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const profiles = savedProfiles.map(s => s.profile)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
          Saved <span className="gradient-text">Profiles</span>
        </h1>
        <p className="text-brand-muted mt-1">
          {profiles.length} saved freelancer{profiles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔖</div>
          <h3 className="text-xl font-semibold text-brand-text mb-2">No saved profiles yet</h3>
          <p className="text-brand-muted mb-6">
            Browse talent and save profiles you&apos;re interested in hiring
          </p>
          <Link href="/browse" className="btn-primary">
            Browse Talent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
