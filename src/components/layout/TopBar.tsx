import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { TimezoneSelector } from '@/components/timezone/TimezoneSelector'
import { CommandPalette } from '@/components/search/CommandPalette'
import { useTheme } from '@/context/ThemeContext'
import { Search, Sun, Moon, Calendar, Users, Shield, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TopBar: React.FC = () => {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isKbdPressed, setIsKbdPressed] = useState(false)

  // Listen to keyboard shortcut '/' or 'Cmd+K' / 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return
      }

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setIsKbdPressed(true)
        setTimeout(() => setIsKbdPressed(false), 200)
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Compact on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { to: '/', label: 'Home', icon: Flag },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/drivers', label: 'Drivers', icon: Users },
    { to: '/teams', label: 'Teams', icon: Shield },
  ]

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-200 border-b border-[var(--border)]',
          isScrolled
            ? 'bg-[var(--surface-1)]/95 py-2.5 backdrop-blur-md shadow-[var(--card-shadow)]'
            : 'bg-[var(--surface-1)] py-3'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="group flex items-center gap-2.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              {/* F1 Paddock Emblem with F1 Skew Cut */}
              <div className="f1-skew w-8 h-8 rounded-sm bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center relative overflow-hidden group-hover:border-[var(--accent)] transition-colors shadow-xs">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />
                <span className="f1-unskew font-display font-black text-xs tracking-tighter text-[var(--text)] pl-1">
                  F1P
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl uppercase tracking-tight leading-none text-[var(--text)] flex items-center gap-1.5">
                  F1 <span className="text-[var(--accent-text)]">Paddock</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest uppercase text-[var(--text-muted)] leading-none mt-0.5">
                  f1paddock.live
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links with Sliding Indicator */}
            <nav className="hidden md:flex items-center gap-1 relative" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'relative px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] select-none',
                      isActive
                        ? 'text-[var(--text)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                    )}
                  >
                    {/* Active sliding indicator underline */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent)] rounded-full f1-skew"
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Action Tools: Search, Timezone, Theme Toggle */}
          <div className="flex items-center gap-2">

            {/* Global Command Palette Trigger with Smooth Expansion */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="h-8 inline-flex items-center gap-2 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--text-muted)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
              aria-label="Search drivers and teams"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="hidden sm:inline font-sans">Search drivers, teams...</span>
              <kbd
                className={cn(
                  'hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono border rounded transition-all duration-150',
                  isKbdPressed
                    ? 'scale-90 bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--surface-1)] text-[var(--text-muted)] border-[var(--border)]'
                )}
              >
                /
              </kbd>
            </button>

            {/* Timezone Selector */}
            <TimezoneSelector />

            {/* Dark / Light Toggle with Morphing Icon & Circular Reveal (exact same height h-8 and radius) */}
            <button
              onClick={(e) => toggleTheme(e)}
              className="h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--text-muted)] hover:bg-[var(--surface-3)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer inline-flex items-center justify-center p-0"
              title={isDark ? 'Switch to Race Day (Light Theme)' : 'Switch to Race Night (Dark Theme)'}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-center w-4 h-4"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-[var(--timing-yellow)]" />
                  ) : (
                    <Moon className="w-4 h-4 text-[var(--text)]" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
