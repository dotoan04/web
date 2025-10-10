'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const SessionProvider = ({ children }: Props) => {
  return (
    <NextAuthSessionProvider refetchInterval={0} refetchOnWindowFocus={true}>
      {children}
    </NextAuthSessionProvider>
  )
}

