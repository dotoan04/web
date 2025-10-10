import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

import type { UserRole } from '@/generated/prisma'
import prisma from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/admin/sign-in',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        )

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          avatarUrl: user.avatarUrl ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const role = (user as { role?: UserRole | null }).role
        if (role) {
          token.role = role
        }

        const id = (user as { id?: string | null }).id
        if (id) {
          token.id = id
        }

        const avatarUrl = (user as { avatarUrl?: string | null }).avatarUrl
        token.avatarUrl = avatarUrl ?? null
      }

      // Update token when profile is updated
      if (trigger === 'update' && session) {
        token.name = session.name
        token.avatarUrl = session.avatarUrl
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id
        }
        if (token.role) {
          session.user.role = token.role
        }
        if (token.name) {
          session.user.name = token.name
        }
        // Always set avatarUrl, even if null, to ensure it's in the session
        session.user.avatarUrl = token.avatarUrl ?? null
        
        // Also update the image field for compatibility
        if (token.avatarUrl) {
          session.user.image = token.avatarUrl
        }
      }
      return session
    },
  },
}

export type AppSession = {
  user: {
    id: string
    email: string
    name?: string | null
    role: string
  }
}
