"use client"

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

const themes = ['light', 'dark', 'theme-sakura', 'theme-aurora']
const themeClassMap: Record<string, string> = {
  light: 'light',
  dark: 'dark',
  'theme-sakura': 'theme-sakura light',
  'theme-aurora': 'theme-aurora dark',
}

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    themes={themes}
    value={themeClassMap}
    {...props}
  >
    {children}
  </NextThemesProvider>
)
