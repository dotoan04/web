"use client"

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import { ThemeTransition } from '@/components/ui/theme-transition'

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    themes={['light', 'dark', 'sunset', 'countryside']}
    {...props}
  >
    <ThemeTransition />
    {children}
    <style jsx global>{`
      *,
      *::before,
      *::after {
        transition: 
          background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
          border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
          color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      body {
        transition: background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      .theme-transition-texture {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
        background: 
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.03) 10px,
            rgba(255, 255, 255, 0.03) 20px
          );
        animation: textureMove 1s linear infinite;
      }

      @keyframes textureMove {
        0% { transform: translate(0, 0); }
        100% { transform: translate(20px, 20px); }
      }

      /* Smooth transition for theme elements */
      @keyframes smoothThemeTransition {
        0% { opacity: 0.8; filter: brightness(1); }
        50% { opacity: 1; filter: brightness(1.05); }
        100% { opacity: 1; filter: brightness(1); }
      }

      .theme-glow {
        position: fixed;
        inset: -50%;
        pointer-events: none;
        z-index: 9997;
        opacity: 0.2;
        background: radial-gradient(
          circle at 50% 50%,
          currentColor 0%,
          transparent 50%
        );
        filter: blur(100px);
        transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), color 0.7s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .theme-glow-enhanced {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9996;
        opacity: 0.2;
        filter: blur(80px);
        transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), background 0.7s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .dark .theme-glow {
        color: rgba(59, 130, 246, 0.25);
      }

      .light .theme-glow,
      :not(.dark):not(.sunset):not(.countryside) .theme-glow {
        color: rgba(139, 92, 246, 0.2);
      }

      .sunset .theme-glow {
        color: rgba(255, 107, 53, 0.3);
        animation: sunsetPulse 3s ease-in-out infinite;
      }

      .countryside .theme-glow {
        color: rgba(16, 185, 129, 0.28);
        animation: countrysidePulse 4s ease-in-out infinite;
      }

      @keyframes sunsetPulse {
        0%, 100% { opacity: 0.2; filter: blur(100px); }
        50% { opacity: 0.35; filter: blur(120px); }
      }

      @keyframes countrysidePulse {
        0%, 100% { opacity: 0.2; filter: blur(100px); }
        50% { opacity: 0.3; filter: blur(110px); }
      }

      /* Theme-specific ambient glow at top of page */
      .theme-ambient-glow {
        background: radial-gradient(
          circle at top,
          rgba(139, 92, 246, 0.25) 0%,
          rgba(243, 244, 255, 0) 70%
        );
        transition: background 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .dark .theme-ambient-glow {
        background: radial-gradient(
          circle at top,
          rgba(59, 130, 246, 0.22) 0%,
          rgba(19, 20, 56, 0) 75%
        );
      }

      .sunset .theme-ambient-glow {
        background: radial-gradient(
          ellipse 120% 60% at top,
          rgba(255, 107, 53, 0.28) 0%,
          rgba(247, 147, 30, 0.18) 35%,
          rgba(251, 191, 36, 0.1) 55%,
          transparent 80%
        );
      }

      .countryside .theme-ambient-glow {
        background: radial-gradient(
          ellipse 100% 70% at top,
          rgba(16, 185, 129, 0.22) 0%,
          rgba(52, 211, 153, 0.15) 40%,
          rgba(110, 231, 183, 0.08) 60%,
          transparent 80%
        );
      }

      /* Optimized element transitions */
      h1, h2, h3, h4, h5, h6, p, a, button, input {
        transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `}</style>
  </NextThemesProvider>
)
