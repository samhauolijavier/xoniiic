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
 * Who may appear in a public listing: browse, the homepage, the leaderboard.
 *
 * Active, not a demo account, and email confirmed. The last one is what makes
 * the promise on the dashboard banner true — an unconfirmed address means the
 * profile is not shown to employers yet. Six queries used to spell this out
 * separately, which is six chances for one of them to quietly disagree with the
 * other five about what "public" means.
 */
export function publiclyListable() {
  return {
    active: true,
    emailVerified: true,
    ...excludeDemoAccounts(),
  }
}
