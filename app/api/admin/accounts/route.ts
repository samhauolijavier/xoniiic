/*
 * Finding an account, and removing one.
 *
 * Deleting a user cascades through forty-four relations — profile, skills,
 * messages, reviews, referrals, conversations. There is no undo and no backup
 * of a single row, so this deliberately cannot do the dangerous version of the
 * job.
 *
 * Two actions:
 *
 *   deactivate — reversible, and the right answer almost every time. The
 *   account stops appearing anywhere public and stops being able to sign in.
 *   Nothing is lost.
 *
 *   delete — hard, and refused outright on any account that has anything. An
 *   empty duplicate created by somebody signing in with a second email is safe
 *   to remove; an account with a profile, a message or a review is not, and no
 *   amount of confirming makes it so. If the real intention is to remove a
 *   member who has content, that is a conversation and a decision, not a button.
 */
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyDiscord } from '@/lib/discord'
import { blockEmail, listBlocked, unblockEmail } from '@/lib/blocklist'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const me = session?.user as { id?: string; role?: string; email?: string } | undefined
  if (!me?.id) return { error: NextResponse.json({ error: 'Sign in first.' }, { status: 401 }) }
  if (me.role !== 'admin') return { error: NextResponse.json({ error: 'Admin only.' }, { status: 403 }) }
  return { me }
}

/** Everything that would be destroyed, counted before anything is. */
async function contentOf(userId: string) {
  const [profile, employer, messages, reviewsGiven, reviewsGot, testimonials, hires, seats] =
    await Promise.all([
      db.seekerProfile.findUnique({ where: { userId }, select: { username: true, title: true, bio: true } }),
      db.employerProfile.findUnique({ where: { userId }, select: { companyName: true } }),
      db.message.count({ where: { senderId: userId } }),
      db.review.count({ where: { reviewerUserId: userId } }),
      db.review.count({ where: { seekerProfile: { userId } } }),
      db.testimonial.count({ where: { userId } }),
      db.hire.count({ where: { seekerId: userId } }),
      db.sandboxAccess.count({ where: { userId } }),
    ])

  const hasProfileContent = Boolean(profile?.title || profile?.bio)
  const counts = { messages, reviewsGiven, reviewsGot, testimonials, hires, seats }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return {
    profile,
    employer,
    counts,
    // Empty means: no filled-in profile, no company, and nothing they have done.
    isEmpty: !hasProfileContent && !employer && total === 0,
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  // The blocked list is small and has no search — it is read whole, so the
  // screen can show it permanently rather than making somebody go looking.
  if (req.nextUrl.searchParams.get('blocked')) {
    return NextResponse.json({ blocked: await listBlocked() })
  }

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] })

  const users = await db.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 25,
  })

  // What each one holds, so the screen can say what removing it would cost
  // rather than asking somebody to guess.
  const detailed = await Promise.all(
    users.map(async u => ({ ...u, ...(await contentOf(u.id)) }))
  )
  return NextResponse.json({ users: detailed })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const me = gate.me!

  const body = await req.json().catch(() => ({}))
  const id = String(body.id ?? '')
  const action = String(body.action ?? '')

  // Handled before the account lookup, because the whole point of a blocklist
  // is that it outlives the account — an address blocked after its empty
  // account was deleted has no row left to find.
  if (action === 'unblock') {
    const email = String(body.email ?? '')
    if (!email) return NextResponse.json({ error: 'No address given.' }, { status: 400 })
    await unblockEmail(email)
    await notifyDiscord({
      title: 'Email unblocked',
      description: email,
      tone: 'good',
      fields: [{ name: 'By', value: me.email ?? me.id!, inline: true }],
    })
    return NextResponse.json({ message: 'Unblocked. They can sign up again.' })
  }

  if (!id) return NextResponse.json({ error: 'No account given.' }, { status: 400 })

  const target = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, active: true },
  })
  if (!target) return NextResponse.json({ error: 'No such account.' }, { status: 404 })

  // The one mistake that locks you out of your own admin screen.
  if (target.id === me.id) {
    return NextResponse.json({ error: 'That is your own account.' }, { status: 400 })
  }
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'Admin accounts cannot be removed here.' }, { status: 400 })
  }

  if (action === 'deactivate' || action === 'reactivate') {
    const active = action === 'reactivate'
    await db.user.update({ where: { id }, data: { active } })
    await notifyDiscord({
      title: active ? 'Account reactivated' : 'Account deactivated',
      description: `${target.name ?? 'No name'} · ${target.email}`,
      tone: active ? 'good' : 'warn',
      fields: [{ name: 'By', value: me.email ?? me.id!, inline: true }],
    })
    return NextResponse.json({ message: active ? 'Account is active again.' : 'Account deactivated. Nothing was deleted.' })
  }

  if (action === 'delete') {
    const content = await contentOf(id)
    if (!content.isEmpty) {
      // Named specifically, because "cannot delete" without a reason is the
      // kind of message that gets worked around rather than understood.
      const has = Object.entries(content.counts)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${n} ${k}`)
      if (content.profile?.title || content.profile?.bio) has.unshift('a filled-in profile')
      if (content.employer) has.unshift('a company profile')
      return NextResponse.json({
        error: `This account has ${has.join(', ')}. Deactivate it instead — that hides it everywhere without destroying anything.`,
      }, { status: 409 })
    }

    await db.user.delete({ where: { id } })
    await notifyDiscord({
      title: 'Empty account deleted',
      description: `${target.name ?? 'No name'} · ${target.email}`,
      tone: 'warn',
      fields: [
        { name: 'By', value: me.email ?? me.id!, inline: true },
        { name: 'Role', value: target.role, inline: true },
      ],
    })
    return NextResponse.json({ message: 'Deleted. It held nothing.' })
  }

  /*
   * Remove and block, in one action.
   *
   * The two halves belong together. Removing an account without blocking the
   * address stops nothing — whoever made it signs up again a minute later,
   * which is the entire behaviour of somebody creating fake accounts. And
   * blocking without removing leaves the account sitting on the site.
   *
   * What "remove" means still depends on what the account holds, on exactly
   * the same terms as the delete action above: empty ones go, anything with a
   * profile or a history is deactivated instead. Blocking is not a licence to
   * destroy somebody's work.
   */
  if (action === 'block') {
    const reason = String(body.reason ?? '').trim() || undefined
    const content = await contentOf(id)

    await blockEmail(target.email, { reason, by: me.email ?? me.id })

    if (content.isEmpty) {
      await db.user.delete({ where: { id } })
    } else {
      await db.user.update({ where: { id }, data: { active: false } })
    }

    await notifyDiscord({
      title: content.isEmpty ? 'Account deleted and email blocked' : 'Account deactivated and email blocked',
      description: `${target.name ?? 'No name'} · ${target.email}`,
      tone: 'warn',
      fields: [
        { name: 'By', value: me.email ?? me.id!, inline: true },
        ...(reason ? [{ name: 'Reason', value: reason, inline: true }] : []),
      ],
    })

    return NextResponse.json({
      message: content.isEmpty
        ? 'Deleted and blocked. It held nothing, and that address cannot sign up again.'
        : 'Deactivated and blocked. Nothing was deleted, and that address cannot sign up again.',
    })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
