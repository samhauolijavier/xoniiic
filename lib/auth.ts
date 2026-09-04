import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db, withRetry } from '@/lib/db'
import { isBlocked } from '@/lib/blocklist'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateUniqueUsername(baseName: string): Promise<string> {
  const base = slugify(baseName) || 'user'
  let username = base
  let count = 1
  while (true) {
    const existing = await withRetry(() => db.seekerProfile.findUnique({ where: { username } }))
    if (!existing) return username
    username = `${base}-${count}`
    count++
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await withRetry(() => db.user.findUnique({
            where: { email: credentials.email },
            include: { seekerProfile: true },
          }))

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          if (!user.active) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            username: user.seekerProfile?.username ?? null,
          }
        } catch (error) {
          console.error('Auth DB error:', error)
          throw new Error('Database connection failed. Please try again.')
        }
      },
    }),
  ],
  callbacks: {
    /*
     * Treat www and the bare domain as one site.
     *
     * The canonical host is now the apex, with www 308-ing to it. But a 308
     * carries the query string across, so a callbackUrl built while somebody was
     * on www — a stale tab, an old bookmark, a link shared before Facebook
     * re-scraped — survives the redirect pointing at the wrong origin. NextAuth
     * rejects it, correctly, because a callback to another origin is how open
     * redirects happen, and the person gets ?error=Callback instead of their
     * dashboard.
     *
     * So www is accepted and rewritten to the apex rather than refused. Anything
     * genuinely off-site still falls back to baseUrl, which is the protection
     * that mattered in the first place.
     */
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl)
        const base = new URL(baseUrl)
        const bare = (h: string) => h.replace(/^www\./, '')
        if (bare(target.hostname) !== bare(base.hostname)) return baseUrl
        return `${base.origin}${target.pathname}${target.search}${target.hash}`
      } catch {
        return baseUrl
      }
    },

    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Retry up to 4 times with longer delays for Google sign-in
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            // Both gates below were missing, and between them they made
            // moderation decorative: the credentials path refuses a
            // deactivated account, but this one never looked, so anybody
            // removed from the site could walk straight back in through
            // "Sign in with Google" — and a deleted fake account could
            // re-create itself on the next click.
            if (await isBlocked(user.email!)) return false

            const existingUser = await db.user.findUnique({ where: { email: user.email! } })
            if (existingUser && !existingUser.active) return false
            if (!existingUser) {
              await db.user.create({
                data: {
                  email: user.email!,
                  name: user.name,
                  role: 'pending',
                  active: true,
                  // Google has already proven this address belongs to them —
                  // that is the entire point of signing in with Google. Asking
                  // for a code on top is not extra safety, it is an unpassable
                  // gate: these accounts have no password and are never sent to
                  // the verify screen. Left false, every Google user would drop
                  // out of browse and the sitemap the moment verification is
                  // switched on.
                  emailVerified: true,
                },
              })
            } else if (!existingUser.emailVerified) {
              // Anyone who signed in with Google before the line above existed.
              await db.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: true },
              })
            }
            return true
          } catch (error) {
            console.error(`Google sign-in DB error (attempt ${attempt + 1}/5):`, error)
            if (attempt < 4) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
            }
          }
        }
        // All retries failed — still allow sign-in, JWT callback will handle DB lookup later
        console.warn('Google sign-in: all DB retries failed, allowing sign-in anyway')
        return true
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'seeker'
        token.id = user.id
        token.username = (user as { username?: string | null }).username ?? null
      }
      if (account?.provider === 'google' && token.email) {
        try {
          const dbUser = await withRetry(() => db.user.findUnique({
            where: { email: token.email as string },
            include: { seekerProfile: true },
          }))
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.username = dbUser.seekerProfile?.username ?? null
          }
        } catch (error) {
          console.error('JWT DB error:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role: string; username: string | null }).id = token.id as string
        ;(session.user as { id: string; role: string; username: string | null }).role = token.role as string
        ;(session.user as { id: string; role: string; username: string | null }).username = token.username as string | null
      }
      return session
    },
  },
}
