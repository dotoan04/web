import { PrismaClient } from '@/generated/prisma'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Prisma Client with optimized settings for serverless
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Connection pool settings for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
