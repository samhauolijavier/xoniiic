import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

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
    const existing = await db.seekerProfile.findUnique({ where: { username } })
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

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { seekerProfile: true },
        })

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
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Upsert Google user
        const existingUser = await db.user.findUnique({ where: { email: user.email! } })
        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email!,
              name: user.name,
              role: 'pending', // role chosen during onboarding
              active: true,
            },
          })
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
      // For Google sign-in, fetch the DB user to get role/id/username
      if (account?.provider === 'google' && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
          include: { seekerProfile: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.username = dbUser.seekerProfile?.username ?? null
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
