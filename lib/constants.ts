// Demo/seed account emails to hide from public-facing pages
export const DEMO_EMAIL_PATTERNS = [
  '@example.com',
  '@techcorp.com',
  '@startupxyz.com',
  '@acmeinc.com',
]

export const DEMO_EMAILS = [
  'admin@virtualfreaks.com',
]

// Prisma WHERE filter to exclude demo accounts
export function excludeDemoAccounts() {
  return {
    AND: [
      ...DEMO_EMAIL_PATTERNS.map(domain => ({
        NOT: { email: { endsWith: domain } }
      })),
      ...DEMO_EMAILS.map(email => ({
        NOT: { email }
      }))
    ]
  }
}

/**
 * Is email verification currently enforced?
 *
 * It governs two things that must agree with each other: whether registration
 * sends somebody to enter a code, and whether an unconfirmed address keeps a
 * profile out of public listings.
 *
 * They stopped agreeing. Verification was hibernated in the register flow while
 * the listing filter below still demanded emailVerified, and nothing sets that
 * column except the verify-email route nobody was being sent to. So every
 * account created since was invisible — not in browse, not on the homepage, not
 * on the leaderboard, not in the sitemap. People filled in a profile and became
 * a ghost, and there was no error anywhere to explain it.
 *
 * One switch now owns both halves. Off, and anybody with an account is listable.
 * On, and codes are required and enforced. Turn it on once the mail provider can
 * carry the volume — a hard verification gate is only as reliable as the email
 * behind it.
 */
export const REQUIRE_EMAIL_VERIFICATION =
  process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

/**
 * Who may appear in a public listing: browse, the homepage, the leaderboard.
 *
 * Active, not a demo account, and — when verification is switched on — a
 * confirmed address. Six queries used to spell this out separately, which is six
 * chances for one of them to quietly disagree with the other five about what
 * "public" means.
 */
export function publiclyListable() {
  return {
    active: true,
    ...(REQUIRE_EMAIL_VERIFICATION ? { emailVerified: true } : {}),
    ...excludeDemoAccounts(),
  }
}
