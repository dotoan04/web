"use client"

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    themes={['light', 'dark', 'sunset', 'countryside']}
    {...props}
  >
    {children}
  </NextThemesProvider>
)
