import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  })

// Cache the client in development to prevent too many connections
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Also cache in production for serverless (Vercel) to reuse connections
if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = db
