import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useSchedule } from '@/api/useF1Data'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { useNow } from '@/hooks/useNow'
import type { TimerVariant, TimerStateMode } from '@/features/timer-v2/types'
import { FIXTURE_SCENARIOS } from '@/features/timer-v2/fixtures'
import { WeekendTimer } from '@/features/timer-v2/WeekendTimer'
import { HeroMockContext } from '@/features/timer-v2/HeroMockContext'
import { cn } from '@/lib/utils'

interface VariantInfo {
  variant: TimerVariant
  name: string
  rationale: string
  isFullWidth?: boolean
}

const VARIANTS: VariantInfo[] = [
  {
    variant: 'A',
    name: 'BOARD (Refined Card)',
    rationale: 'Safe telemetry upgrade with 4-column digit grid, hairline dividers, and an accent red tick over seconds.',
  },
  {
    variant: 'B',
    name: 'DAY GRID',
    rationale: 'Shortest vertical footprint with single-line top countdown and side-by-side day columns.',
  },
  {
    variant: 'C',
    name: 'START LIGHTS',
    rationale: 'Motorsport start-gantry metaphor with five lights, pulsing next session ring, and 5s sequence.',
  },
  {
    variant: 'D',
    name: 'PLAYHEAD TIMELINE',
    rationale: 'Continuous time-scaled axis tracking the weekend from Friday through Sunday with playhead scrub.',
  },
  {
    variant: 'E',
    name: 'ROLL COUNTER',
    rationale: 'Large single-line mechanical rolling digits with progressive disclosure for full weekend schedule.',
  },
  {
    variant: 'F',
    name: 'TICKER LINE (No Box)',
    rationale: 'Full-width architectural strip spanning under the hero fact grid with 7-day build-up progress bar.',
    isFullWidth: true,
  },
]

export const TimerLabPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme, setTheme } = useTheme()
  const tz = useTimezone()
  const now = useNow(10000)
  const { data: schedule } = useSchedule()

  // Read URL query params
  const paramVariant = (searchParams.get('variant') || 'all').toUpperCase()
  const paramState = (searchParams.get('state') || 'gt24h') as TimerStateMode
  const paramTheme = searchParams.get('theme') || theme
  const paramMotion = searchParams.get('motion') === 'reduced'
  const paramFormat = (searchParams.get('format') || '24h') as '12h' | '24h'
  const paramView = searchParams.get('view') || 'compare' // 'compare' | 'context'
  const paramUseReal = searchParams.get('real') === 'true'

  // Local state initialized from URL
  const [selectedVariant, setSelectedVariant] = useState<string>(paramVariant)
  const [stateMode, setStateMode] = useState<TimerStateMode>(paramState)
  const [reducedMotion, setReducedMotion] = useState<boolean>(paramMotion)
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(paramFormat)
  const [viewMode, setViewMode] = useState<'compare' | 'context'>(paramView as 'compare' | 'context')
  const [useRealData, setUseRealData] = useState<boolean>(paramUseReal)

  // Sync to URL parameters
  const syncParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(updates).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) {
          next.delete(k)
        } else {
          next.set(k, v)
        }
      })
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  // Sync theme to document
  useEffect(() => {
    if (paramTheme && (paramTheme === 'dark' || paramTheme === 'light') && paramTheme !== theme) {
      setTheme(paramTheme)
    }
  }, [paramTheme, theme, setTheme])

  // Real production sessions if toggled
  const realSessions = useMemo(() => {
    if (!schedule?.races) return null
    const nextRace = SessionService.findNextRace(schedule.races, now)
    return nextRace ? SessionService.extractWeekendSessions(nextRace, now) : null
  }, [schedule, now])

  // Active dataset: Fixtures or Real Data
  const activeScenario = FIXTURE_SCENARIOS[stateMode] || FIXTURE_SCENARIOS.gt24h
  const activeSessions = useRealData && realSessions ? realSessions : activeScenario.sessions
  const activeClockIso = useRealData ? now.toISOString() : activeScenario.clockIso
  const timezoneLabel = tz.timezoneAbbr || 'EDT'

  // Filtered variants
  const displayedVariants = useMemo(() => {
    if (selectedVariant === 'ALL') return VARIANTS
    return VARIANTS.filter((v) => v.variant === selectedVariant)
  }, [selectedVariant])

  return (
    <div
      data-testid="timer-lab-page"
      className={cn(
        'min-h-screen w-full max-w-full overflow-x-clip bg-[var(--bg)] text-[var(--text)] transition-colors duration-200 flex flex-col font-sans antialiased',
        reducedMotion && 'motion-reduce'
      )}
    >
      {/* Top Controls Bar (Test-Only Toolbar) */}
      <header className="sticky top-0 z-50 bg-[var(--surface-1)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-3 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs max-w-full">
        {/* Left: Lab Title & Route Badge */}
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold tracking-tight text-[13px] uppercase">
            Timer Design Lab
          </span>
          <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-muted)]">
            /test/timer
          </span>
        </div>

        {/* Center: State Selector (States 1 to 6) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] mr-1">
            State:
          </span>
          {(
            [
              ['gt24h', '1: >24h'],
              ['lt24h', '2: <24h'],
              ['lt1h', '3: <1h'],
              ['lt1m', '4: <1m'],
              ['running', '5: Running'],
              ['completed', '6: Complete'],
            ] as const
          ).map(([modeKey, label]) => (
            <button
              key={modeKey}
              type="button"
              disabled={useRealData}
              onClick={() => {
                setStateMode(modeKey)
                syncParams({ state: modeKey })
              }}
              className={cn(
                'px-2 py-1 rounded-[4px] font-mono text-[11px] transition-colors whitespace-nowrap',
                stateMode === modeKey && !useRealData
                  ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]',
                useRealData && 'opacity-30 cursor-not-allowed'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: Toggles (View Mode, Real Data, Format, Theme, Motion) */}
        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center rounded-full p-0.5 bg-[var(--surface-2)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setViewMode('compare')
                syncParams({ view: 'compare' })
              }}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] transition-colors',
                viewMode === 'compare'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              Compare
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('context')
                syncParams({ view: 'context' })
              }}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] transition-colors',
                viewMode === 'context'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              In Context
            </button>
          </div>

          {/* Real Data Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !useRealData
              setUseRealData(next)
              syncParams({ real: String(next) })
            }}
            className={cn(
              'px-2 py-1 rounded-[4px] border font-mono text-[11px] transition-colors',
              useRealData
                ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                : 'bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-muted)]'
            )}
            title="Toggle between deterministic test fixtures and live upcoming Grand Prix"
          >
            {useRealData ? 'Live Data' : 'Fixtures'}
          </button>

          {/* 12h / 24h Preference */}
          <button
            type="button"
            onClick={() => {
              const next = timeFormat === '24h' ? '12h' : '24h'
              setTimeFormat(next)
              syncParams({ format: next })
            }}
            className="px-2 py-1 rounded-[4px] bg-[var(--surface-2)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {timeFormat}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark'
              setTheme(next)
              syncParams({ theme: next })
            }}
            className="px-2 py-1 rounded-[4px] bg-[var(--surface-2)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          {/* Reduced Motion Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !reducedMotion
              setReducedMotion(next)
              syncParams({ motion: next ? 'reduced' : 'normal' })
            }}
            className={cn(
              'px-2 py-1 rounded-[4px] border font-mono text-[11px] transition-colors',
              reducedMotion
                ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] font-semibold'
                : 'bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-muted)]'
            )}
          >
            {reducedMotion ? 'Reduced Motion: ON' : 'Motion: Normal'}
          </button>
        </div>
      </header>

      {/* Variant Selector Filter Bar */}
      <div className="bg-[var(--surface-2)]/60 border-b border-[var(--border-subtle)] px-4 sm:px-8 py-2.5 flex items-center justify-between gap-3 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] mr-1">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedVariant('ALL')
              syncParams({ variant: 'all' })
            }}
            className={cn(
              'px-2.5 py-1 rounded-[4px] font-mono text-[11px]',
              selectedVariant === 'ALL'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                : 'bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border-subtle)]'
            )}
          >
            ALL (6)
          </button>
          {VARIANTS.map((v) => (
            <button
              key={v.variant}
              type="button"
              onClick={() => {
                setSelectedVariant(v.variant)
                syncParams({ variant: v.variant })
              }}
              className={cn(
                'px-2.5 py-1 rounded-[4px] font-mono text-[11px]',
                selectedVariant === v.variant
                  ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border-subtle)]'
              )}
            >
              {v.variant}: {v.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Current State Indicator */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
          <span>Clock: {new Date(activeClockIso).toUTCString()}</span>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-[1560px] mx-auto px-4 sm:px-8 py-8 flex flex-col gap-10">
        {viewMode === 'context' ? (
          /* In Context Mode: Faithful mock of Hero layout */
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[var(--accent)] font-semibold">
                  In Context View — Variant {selectedVariant === 'ALL' ? 'A' : selectedVariant}
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Faithful representation of the Hero layout (title, 3D circuit placeholder, track data facts, button) to evaluate spatial harmony.
                </p>
              </div>
              {selectedVariant === 'ALL' && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  (Showing Variant A by default; pick a specific variant tab above to inspect others in context)
                </span>
              )}
            </div>

            <HeroMockContext
              variant={(selectedVariant === 'ALL' ? 'A' : selectedVariant) as TimerVariant}
              sessions={activeSessions}
              clockIso={activeClockIso}
              timezoneLabel={timezoneLabel}
              timeFormat={timeFormat}
            />
          </div>
        ) : (
          /* Compare All Mode: Desktop Right Column (~420px) next to 360px Mobile Frame */
          <div className="flex flex-col gap-12">
            {displayedVariants.map((item) => (
              <section
                key={item.variant}
                data-testid={`variant-section-${item.variant}`}
                className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-10 last:border-b-0"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl sm:text-2xl font-mono font-bold text-[var(--accent)]">
                      [{item.variant}]
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                      {item.name}
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] max-w-xl">
                    {item.rationale}
                  </p>
                </div>

                {/* Frames Container */}
                {item.isFullWidth ? (
                  /* Variant F: Full-Width Frame */
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                      Full-Width Hero Strip Frame (100% Container)
                    </span>
                    <div className="w-full bg-[var(--surface-2)]/30 border border-[var(--border-subtle)] rounded-[4px] p-4">
                      <WeekendTimer
                        variant={item.variant}
                        sessions={activeSessions}
                        clockIso={activeClockIso}
                        timezoneLabel={timezoneLabel}
                        timeFormat={timeFormat}
                      />
                    </div>
                  </div>
                ) : (
                  /* Standard Variants: Desktop Column (420px) next to Mobile Frame (360px) */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Desktop Hero Right-Column Frame (420px) */}
                    <div className="lg:col-span-7 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)]">
                        <span>Desktop Right Column Frame (Width: 420px)</span>
                        <span>Max Budget: 400px</span>
                      </div>
                      <div data-testid="frame-desktop" className="w-full max-w-[420px] bg-[var(--surface-2)]/30 border border-dashed border-[var(--border-subtle)] rounded-[4px] p-2">
                        <WeekendTimer
                          variant={item.variant}
                          sessions={activeSessions}
                          clockIso={activeClockIso}
                          timezoneLabel={timezoneLabel}
                          timeFormat={timeFormat}
                        />
                      </div>
                    </div>

                    {/* Mobile Frame (360px viewport simulation) */}
                    <div className="lg:col-span-5 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)]">
                        <span>Mobile Frame (Width: 360px)</span>
                        <span>Max Budget: 380px</span>
                      </div>
                      <div data-testid="frame-mobile" className="w-[360px] max-w-full bg-[var(--surface-2)]/30 border border-dashed border-[var(--border-subtle)] rounded-[4px] p-2">
                        <WeekendTimer
                          variant={item.variant}
                          sessions={activeSessions}
                          clockIso={activeClockIso}
                          timezoneLabel={timezoneLabel}
                          timeFormat={timeFormat}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default TimerLabPage
