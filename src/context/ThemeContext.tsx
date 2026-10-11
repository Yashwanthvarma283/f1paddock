import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { appStorage } from '@/lib/storage'

export type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  toggleTheme: (event?: React.MouseEvent) => void
  setTheme: (theme: Theme, event?: React.MouseEvent) => void
}

const STORAGE_KEY = 'f1paddock_theme_mode'
const LEGACY_STORAGE_KEY = 'pitwall_theme_mode'

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = appStorage.getItem<Theme | null>(STORAGE_KEY, null) ?? appStorage.getItem<Theme | null>(LEGACY_STORAGE_KEY, null)
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
    // Respect prefers-color-scheme on first visit
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
    return 'dark'
  })

  // Synchronize document classes and persistence
  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    appStorage.setItem(STORAGE_KEY, newTheme)
    appStorage.setItem(LEGACY_STORAGE_KEY, newTheme)
  }, [])

  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme, applyThemeToDOM])

  /**
   * Smooth animated theme toggle:
   * Uses View Transitions API with circular reveal from toggle button coordinates.
   * Gracefully falls back to 250ms CSS crossfade where unsupported.
   * Respects prefers-reduced-motion.
   */
  const switchThemeWithAnimation = useCallback(
    (nextTheme: Theme, event?: React.MouseEvent) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        setThemeState(nextTheme)
        return
      }

      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // If user requested reduced motion, fallback to instant swap
      if (isReduced) {
        setThemeState(nextTheme)
        applyThemeToDOM(nextTheme)
        return
      }

      const docAny = document as unknown as {
        documentElement: HTMLElement
        startViewTransition?: (cb: () => void) => { ready: Promise<void> }
      }

      // Check for View Transitions API support
      if (typeof docAny.startViewTransition === 'function') {
        const x = event?.clientX ?? window.innerWidth - 48
        const y = event?.clientY ?? 40
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )

        const transition = docAny.startViewTransition(() => {
          setThemeState(nextTheme)
          applyThemeToDOM(nextTheme)
        })

        transition.ready
          .then(() => {
            docAny.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 500, // Slightly longer duration for smoother visual interpolation
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            )
          })
          .catch(() => {
            // In case of transition abort, theme state already applied
          })
      } else {
        // Fallback: Instant swap (prevents massive CSS transition lag)
        setThemeState(nextTheme)
        applyThemeToDOM(nextTheme)
      }
    },
    [applyThemeToDOM]
  )

  const toggleTheme = useCallback(
    (event?: React.MouseEvent) => {
      const next = theme === 'dark' ? 'light' : 'dark'
      switchThemeWithAnimation(next, event)
    },
    [theme, switchThemeWithAnimation]
  )

  const setTheme = useCallback(
    (t: Theme, event?: React.MouseEvent) => {
      if (t !== theme) {
        switchThemeWithAnimation(t, event)
      }
    },
    [theme, switchThemeWithAnimation]
  )

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
