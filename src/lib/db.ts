import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is available
const DATABASE_URL = process.env.DATABASE_URL

// Create Prisma client only if DATABASE_URL is configured
// This allows the app to run in demo mode without a database
function createPrismaClient(): PrismaClient | null {
  if (!DATABASE_URL) {
    console.log('No DATABASE_URL found - running in demo mode without database')
    return null
  }

  try {
    return (
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
        // For serverless platforms like Netlify
        datasources: {
          db: {
            url: DATABASE_URL,
          },
        },
      })
    )
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    return null
  }
}

export const db = createPrismaClient()

if (process.env.NODE_ENV !== 'production' && db) {
  globalForPrisma.prisma = db
}

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return db !== null
}
