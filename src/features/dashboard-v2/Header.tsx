import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { CommandPalette } from '@/components/search/CommandPalette'
import { cn } from '@/lib/utils'
import { MobileDrawer, type NavItem } from './MobileDrawer'
import { TimezoneControl } from './TimezoneControl'

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/teams', label: 'Teams' },
]

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="dv2-press h-9 w-9 inline-flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-colors duration-150 cursor-pointer"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

/**
 * Dashboard-v2 header. 64px tall, nav on a single line at desktop.
 * Below lg it collapses to the compact shape: menu left, wordmark centre,
 * search right, with timezone and theme moved into the drawer.
 */
export const Header: React.FC = () => {
  const location = useLocation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // The dashboard sample stands in for Home
  const activeLabel =
    location.pathname === '/' || location.pathname.startsWith('/test/dashboard')
      ? 'Home'
      : NAV_ITEMS.find((item) => location.pathname.startsWith(item.to) && item.to !== '/')?.label ??
        ''

  // Automatically close drawer when navigating
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [location.pathname])

  // Keyboard-initiated, so the palette opens with no animation of its own
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const wordmark = (
    <Link
      to="/test/dashboard"
      className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.01em] text-[22px] leading-none text-[var(--text)] flex items-center gap-1.5 group"
    >
      <span>F1</span>
      <span className="text-[var(--accent)]">Paddock</span>
    </Link>
  )

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[var(--bg)] border-b border-[var(--border-subtle)]">
        <div className="mx-auto max-w-[1560px] h-16 px-5 md:px-8 lg:px-12 flex items-center gap-4">
          {/* Mobile: menu */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
            className="dv2-press lg:hidden h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors duration-150 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile: centred wordmark / Desktop: left wordmark */}
          <div className="flex-1 flex justify-center lg:flex-none lg:justify-start">
            {wordmark}
          </div>

          {/* Desktop nav, single line */}
          <nav className="hidden lg:flex items-center gap-8 ml-8" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === activeLabel
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative py-2 text-[15px] font-semibold transition-colors duration-150',
                    isActive
                      ? 'text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  )}
                >
                  {item.label}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 -bottom-[14px] h-[2px] bg-[var(--accent)]"
                    />
                  ) : null}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 lg:ml-auto">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              className="dv2-press h-9 inline-flex items-center gap-2 px-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-colors duration-150 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="hidden xl:inline text-[13px]">Search</span>
              <kbd className="dv2-fig hidden xl:inline text-[11px] px-1.5 py-0.5 rounded-[4px] border border-[var(--border)] text-[var(--text-muted)]">
                /
              </kbd>
            </button>

            <div className="hidden lg:block">
              <TimezoneControl />
            </div>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={NAV_ITEMS}
        activeLabel={activeLabel}
        footer={
          <>
            <TimezoneControl />
            <ThemeToggle />
          </>
        }
      />

      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
