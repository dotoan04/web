import type { UserRole } from '@/generated/prisma'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: UserRole
      avatarUrl?: string | null
    }
  }

  interface User {
    id: string
    role: UserRole
    avatarUrl?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: UserRole
    avatarUrl?: string | null
  }
}
