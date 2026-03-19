import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is available
// Support both DATABASE_URL and NETLIFY_DATABASE_URL (Netlify Neon integration)
const DATABASE_URL = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return !!DATABASE_URL
}

// Get the actual database URL being used
export function getDatabaseUrl(): string | undefined {
  return DATABASE_URL
}

// Create a proxy that throws a friendly error when db is accessed without a database
function createNullDbProxy(): PrismaClient {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      // Allow typeof check
      if (prop === 'then') {
        return undefined
      }
      throw new Error(
        `Database not available. Running in demo mode without DATABASE_URL. ` +
        `Cannot access '${String(prop)}' on database client.`
      )
    }
  }
  return new Proxy({}, handler) as unknown as PrismaClient
}

// Create Prisma client only if DATABASE_URL is configured
// This allows the app to run in demo mode without a database
function createPrismaClient(): PrismaClient {
  if (!DATABASE_URL) {
    console.log('No DATABASE_URL found - running in demo mode without database')
    return createNullDbProxy()
  }

  try {
    const client = globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
        // For serverless platforms like Netlify
        datasources: {
          db: {
            url: DATABASE_URL,
          },
        },
      })
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client
    }
    
    return client
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    return createNullDbProxy()
  }
}

export const db = createPrismaClient()

// Alias for consistency - some files use prisma, others use db
export const prisma = db

// Export a safe version for use in API routes that need to check first
export const dbSafe = {
  get client() {
    return isDatabaseAvailable() ? db : null
  }
}
