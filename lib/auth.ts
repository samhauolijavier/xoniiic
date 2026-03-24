import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db, withRetry } from '@/lib/db'

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
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await withRetry(() => db.user.findUnique({ where: { email: user.email! } }))
          if (!existingUser) {
            await withRetry(() => db.user.create({
              data: {
                email: user.email!,
                name: user.name,
                role: 'pending',
                active: true,
              },
            }))
          }
        } catch (error) {
          console.error('Google sign-in DB error:', error)
          return false
        }
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
