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
