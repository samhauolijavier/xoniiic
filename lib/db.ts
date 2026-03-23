import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  })
  return client
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// Cache globally to reuse across serverless invocations
globalForPrisma.prisma = db

// Helper for retrying failed DB queries (connection pool exhaustion)
export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === retries) throw error
      console.warn(`DB query failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`)
      await new Promise(r => setTimeout(r, delay * (attempt + 1)))
    }
  }
  throw new Error('Unreachable')
}
