import { db, withRetry } from '@/lib/db'
import type { AccessSource, SandboxAccess } from '@prisma/client'

// One month of sandbox access. Every grant is a month, whatever paid for it —
// pesos, a passed scenario, someone else's generosity. The source changes who
// owes what; it never changes how long the seat lasts.
export const SEAT_DAYS = 30

// The default, not the authority. The live figure is a site setting so the
// price can move without a deploy — it has already moved once, and it is tied
// to a QR image with the amount printed on it, so the two need to be changeable
// together and at the same moment.
export const SEAT_PRICE_PESOS = 129
export const SEAT_PRICE_SETTING = 'seatPricePesos'

const DAY = 24 * 60 * 60 * 1000

export type SeatStatus = {
  active: boolean
  endsAt: Date | null
  daysLeft: number
  /** calm > 7 days · soon 3-7 · now under 3 · none when there is no seat */
  urgency: 'calm' | 'soon' | 'now' | 'none'
  sources: AccessSource[]
  subAccount: string | null
  /** a claim they have made that nobody has checked yet */
  pendingReference: string | null
  /**
   * Payment confirmed, sandbox not built yet. The middle of the process:
   * their money is matched, somebody is creating their GoHighLevel user, and
   * the thirty days have deliberately not started — a clock running on an
   * account they cannot log into yet is a day they paid for and lost.
   */
  awaitingSandbox: boolean
}

/**
 * Grants stack end to end rather than overlapping. Someone who pays on day 25
 * of a paid month gets 35 days left, not 30 — buying early must never cost you
 * the days you already had, or nobody renews until the last hour.
 */
export function nextStart(currentEnd: Date | null, now: Date): Date {
  return currentEnd && currentEnd > now ? currentEnd : now
}

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / DAY))
}

export function urgencyFor(daysLeft: number, active: boolean): SeatStatus['urgency'] {
  if (!active) return 'none'
  if (daysLeft <= 3) return 'now'
  if (daysLeft <= 7) return 'soon'
  return 'calm'
}

/** Every grant that has not yet run out, soonest expiry first. */
export async function liveGrants(userId: string): Promise<SandboxAccess[]> {
  return withRetry(() => db.sandboxAccess.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'asc' },
  }))
}

export async function seatStatus(userId: string): Promise<SeatStatus> {
  const now = new Date()
  const [grants, pending, confirmed] = await Promise.all([
    liveGrants(userId),
    withRetry(() => db.gcashPayment.findFirst({
      where: { userId, state: { in: ['awaiting_proof', 'awaiting_check'] } },
      orderBy: { createdAt: 'desc' },
      select: { reference: true },
    })),
    // Verified, but no seat hung off it yet — step three of the process.
    withRetry(() => db.gcashPayment.findFirst({
      where: { userId, state: 'verified', accessId: null },
      orderBy: { createdAt: 'desc' },
      select: { reference: true },
    })),
  ])

  const endsAt = grants.length ? grants[grants.length - 1].expiresAt : null
  const active = Boolean(endsAt && endsAt > now)
  const daysLeft = active && endsAt ? daysBetween(now, endsAt) : 0

  return {
    active,
    endsAt,
    daysLeft,
    urgency: urgencyFor(daysLeft, active),
    sources: grants.map(g => g.source),
    subAccount: grants.find(g => g.subAccount)?.subAccount ?? null,
    pendingReference: pending?.reference ?? confirmed?.reference ?? null,
    awaitingSandbox: Boolean(confirmed) && !active,
  }
}

/**
 * Adds a month to someone's seat. Returns the grant so a payment row can point
 * at it — the audit trail runs payment -> grant, so a seat can always be traced
 * back to what bought it.
 */
export async function grantSeat(opts: {
  userId: string
  source: AccessSource
  days?: number
  subAccount?: string | null
  note?: string | null
  grantedBy?: string | null
}): Promise<SandboxAccess> {
  const now = new Date()
  const grants = await liveGrants(opts.userId)
  const currentEnd = grants.length ? grants[grants.length - 1].expiresAt : null
  const startsAt = nextStart(currentEnd, now)
  const expiresAt = new Date(startsAt.getTime() + (opts.days ?? SEAT_DAYS) * DAY)

  return withRetry(() => db.sandboxAccess.create({
    data: {
      userId: opts.userId,
      source: opts.source,
      startsAt,
      expiresAt,
      subAccount: opts.subAccount ?? null,
      note: opts.note ?? null,
      grantedBy: opts.grantedBy ?? null,
    },
  }))
}

// GCash references are 13 digits, but people paste them with spaces, dashes, or
// the "Ref. No." label still attached. Strip it down before we judge it, so a
// correct payment is never rejected over punctuation.
export function normalizeReference(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export function referenceLooksValid(normalized: string): boolean {
  return normalized.length >= 6 && normalized.length <= 30
}

// Referral codes are read aloud and retyped from phone screens, so the alphabet
// drops every character that can be mistaken for another: no O/0, I/1/L, S/5.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRTUVWXYZ2346789'

export function makeReferralCode(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[hash % CODE_ALPHABET.length]
    hash = Math.floor(hash / CODE_ALPHABET.length) + (hash % 7) * 131
  }
  return code
}

/** Idempotent: hands back the code they already have rather than churning it. */
export async function referralCodeFor(userId: string): Promise<string> {
  const user = await withRetry(() => db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  }))
  if (user?.referralCode) return user.referralCode

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeReferralCode(userId + (attempt ? `-${attempt}` : ''))
    const taken = await withRetry(() => db.user.findUnique({ where: { referralCode: code }, select: { id: true } }))
    if (taken) continue
    await withRetry(() => db.user.update({ where: { id: userId }, data: { referralCode: code } }))
    return code
  }
  throw new Error('Could not allocate a referral code')
}

/**
 * What a seat costs today. Falls back to the default if nothing is set or the
 * stored value is nonsense — a broken setting must never show someone a price
 * of zero, or NaN, on a payment page.
 */
export async function seatPrice(): Promise<number> {
  try {
    const setting = await withRetry(() => db.siteSetting.findUnique({
      where: { key: SEAT_PRICE_SETTING },
      select: { value: true },
    }))
    const parsed = Number(setting?.value)
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 100000) return Math.round(parsed)
  } catch (error) {
    console.error('Seat price lookup failed, using default:', error)
  }
  return SEAT_PRICE_PESOS
}
