import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-heading)', 'serif'],
        body: ['var(--font-body)', 'serif'],
        sans: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f4f2ec',
          100: '#e5e0d1',
          200: '#cfc1a3',
          300: '#b6a077',
          400: '#9f7f51',
          500: '#80623a',
          600: '#654d2f',
          700: '#4c3a26',
          800: '#302318',
          900: '#1b140e',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        scroll: '0 20px 45px rgba(27, 20, 14, 0.2)',
      },
      typography: ({ theme }) => ({
        ink: {
          css: {
            '--tw-prose-body': theme('colors.ink.700'),
            '--tw-prose-headings': theme('colors.ink.900'),
            '--tw-prose-links': theme('colors.ink.800'),
            '--tw-prose-bold': theme('colors.ink.900'),
            '--tw-prose-quotes': theme('colors.ink.500'),
            '--tw-prose-code': theme('colors.ink.800'),
            '--tw-prose-bullets': theme('colors.ink.400'),
            maxWidth: '72ch',
            p: {
              lineHeight: '1.7',
              marginTop: '1.2em',
              marginBottom: '1.2em',
            },
            a: {
              color: theme('colors.ink.700'),
              textDecoration: 'none',
              borderBottom: `1px solid ${theme('colors.ink.300')}`,
              fontWeight: 500,
              '&:hover': {
                color: theme('colors.ink.900'),
                borderBottomColor: theme('colors.ink.500'),
              },
            },
            h2: {
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.02em',
              marginTop: '2.5em',
              marginBottom: '1em',
            },
            h3: {
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.015em',
              marginTop: '2em',
              marginBottom: '0.8em',
            },
            blockquote: {
              borderLeftColor: theme('colors.ink.200'),
              fontStyle: 'normal',
              paddingLeft: '1.25rem',
              color: theme('colors.ink.600'),
            },
            code: {
              backgroundColor: theme('colors.ink.50'),
              padding: '0.2rem 0.4rem',
              borderRadius: theme('borderRadius.lg'),
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              borderRadius: theme('borderRadius.2xl'),
              padding: '1rem',
            },
          },
        },
        'ink-dark': {
          css: {
            '--tw-prose-body': theme('colors.ink.100'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-links': theme('colors.ink.100'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-quotes': theme('colors.ink.200'),
            '--tw-prose-code': theme('colors.ink.50'),
            '--tw-prose-bullets': theme('colors.ink.300'),
            maxWidth: '72ch',
            p: {
              lineHeight: '1.7',
            },
            a: {
              color: theme('colors.ink.100'),
              borderBottomColor: theme('colors.ink.400'),
              '&:hover': {
                borderBottomColor: theme('colors.ink.200'),
              },
            },
            blockquote: {
              borderLeftColor: theme('colors.ink.700'),
              color: theme('colors.ink.200'),
            },
            code: {
              backgroundColor: theme('colors.ink.800'),
              color: theme('colors.ink.50'),
            },
            pre: {
              backgroundColor: theme('colors.ink.900'),
              borderColor: theme('colors.ink.700'),
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
}
export default config
