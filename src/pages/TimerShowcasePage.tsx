import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useSchedule } from '@/api/useF1Data'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { useNow } from '@/hooks/useNow'
import { DashboardHero } from '@/features/dashboard-v2/DashboardHero'
import { TimerPitWall } from '@/features/dashboard-v2/timer-variants/TimerPitWall'
import { TimerMinimalist } from '@/features/dashboard-v2/timer-variants/TimerMinimalist'
import { TimerTimekeeper } from '@/features/dashboard-v2/timer-variants/TimerTimekeeper'
import { Sun, Moon, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TimerShowcasePage: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const tz = useTimezone()
  const now = useNow(10000)
  const { data: schedule } = useSchedule()

  const [activeTab, setActiveTab] = useState<'hero' | 'matrix'>('hero')
  const [selectedVariant, setSelectedVariant] = useState<'pitwall' | 'minimalist' | 'timekeeper' | 'baseline'>('pitwall')

  const nextRace = schedule?.races ? SessionService.findNextRace(schedule.races, now) : null
  const weekendSessions = nextRace ? SessionService.extractWeekendSessions(nextRace, now) : []
  const nextSession = SessionService.getNextUpcomingSession(weekendSessions, now)
  const countdownTarget = nextSession?.startTimeIso || null
  const isSessionLive = Boolean(nextSession?.isLive)

  const timerProps = {
    countdownTarget,
    nextSession,
    isSessionLive,
    weekendSessions,
    timezoneAbbr: tz.timezoneAbbr,
    formatWeekday: tz.formatWeekday,
    formatTime: tz.formatTime,
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-200 flex flex-col">
      {/* Top Navigation & Controls Bar */}
      <header className="sticky top-0 z-50 bg-[var(--surface-1)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface-2)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-[var(--border)]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold tracking-tight">Hero Timer Box Lab</span>
              <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 font-mono text-[10px] uppercase font-bold border border-red-500/20">
                /test/timer
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
              Explore and evaluate the 3 proposed redesign concepts for the Hero Countdown & Weekend Schedule
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveTab('hero')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                activeTab === 'hero'
                  ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              Live Hero Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                activeTab === 'matrix'
                  ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              Side-by-Side Matrix
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-medium hover:border-[var(--text-muted)] transition-colors"
            title="Toggle Light / Dark mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'hero' ? (
          <div className="flex flex-col">
            {/* Interactive Model Switcher Banner */}
            <div className="w-full bg-[var(--surface-2)]/60 border-b border-[var(--border)] py-4 px-4 sm:px-8">
              <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--text-muted)]">
                    Active Design In Preview
                  </div>
                  <div className="text-sm font-bold text-[var(--text)]">
                    {selectedVariant === 'pitwall' && '🏎️ Option A: Pit Wall Telemetry Tower (High-Tech Motorsport)'}
                    {selectedVariant === 'minimalist' && '⚡ Option B: Minimalist Floating Pods (Clean & Architectural)'}
                    {selectedVariant === 'timekeeper' && '⏱️ Option C: Official Timekeeper (Rolex / Precision Luxury)'}
                    {selectedVariant === 'baseline' && '📦 Current Baseline (Original Gray Box)'}
                  </div>
                </div>

                {/* Variant Switch Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVariant('pitwall')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5',
                      selectedVariant === 'pitwall'
                        ? 'bg-red-600 text-white border-red-500 shadow-md font-semibold'
                        : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text)] hover:border-red-500/50'
                    )}
                  >
                    <span>Option A (Pit Wall)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVariant('minimalist')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5',
                      selectedVariant === 'minimalist'
                        ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-md font-semibold'
                        : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text)] hover:border-[var(--text)]'
                    )}
                  >
                    <span>Option B (Minimalist)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVariant('timekeeper')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5',
                      selectedVariant === 'timekeeper'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-semibold'
                        : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text)] hover:border-emerald-500/50'
                    )}
                  >
                    <span>Option C (Timekeeper)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVariant('baseline')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium border transition-all',
                      selectedVariant === 'baseline'
                        ? 'bg-[var(--surface-3)] text-[var(--text)] border-[var(--border)] font-semibold'
                        : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    )}
                  >
                    <span>Baseline (Old)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Dashboard Hero with the selected variant rendered */}
            <DashboardHero timerVariant={selectedVariant} />

            {/* Concept Details Callout Box */}
            <div className="max-w-[1560px] mx-auto w-full px-5 md:px-8 lg:px-12 py-8 border-t border-[var(--border)] mt-4">
              <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-5 sm:p-6">
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Design Specifications & Architecture
                </div>
                {selectedVariant === 'pitwall' && (
                  <div className="space-y-2 text-sm text-[var(--text)]">
                    <p className="font-semibold text-red-500">
                      Option A: The Pit Wall Telemetry Tower
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)]">
                      <li><strong className="text-[var(--text)]">Racing Signature:</strong> Red top accent notch with pulsating GPS telemetry radar pill.</li>
                      <li><strong className="text-[var(--text)]">Digital Cubes:</strong> 4 segmented timing blocks (Days, Hours, Mins, Secs) with tabular monospace digits and dark beveled inset styling.</li>
                      <li><strong className="text-[var(--text)]">Telemetry Badges:</strong> Color-coded visual badges for each session type (FP1/2/3, Qualifying, Sprint, Grand Prix) with status checkmarks for completed sessions.</li>
                    </ul>
                  </div>
                )}
                {selectedVariant === 'minimalist' && (
                  <div className="space-y-2 text-sm text-[var(--text)]">
                    <p className="font-semibold text-[var(--text)]">
                      Option B: Minimalist Floating Pods
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)]">
                      <li><strong className="text-[var(--text)]">Borderless Freedom:</strong> Eliminates the heavy bounding box; seamlessly flows with Dashboard v2's clean underlined aesthetic.</li>
                      <li><strong className="text-[var(--text)]">Massive Typography:</strong> 48px bold typographic digits floating freely with understated unit suffixes.</li>
                      <li><strong className="text-[var(--text)]">Horizontal Timeline Ribbon:</strong> Chronological visual pills across the weekend days with active stage highlighting and a toggle to switch to compact list mode.</li>
                    </ul>
                  </div>
                )}
                {selectedVariant === 'timekeeper' && (
                  <div className="space-y-2 text-sm text-[var(--text)]">
                    <p className="font-semibold text-emerald-400">
                      Option C: Official Timekeeper Card (Rolex / Precision Watch Luxury)
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)]">
                      <li><strong className="text-[var(--text)]">Obsidian Frosted Glass:</strong> Deep backdrop-blur glass styling with metallic hairline emerald glow accents.</li>
                      <li><strong className="text-[var(--text)]">Countdown Progress Bar:</strong> Continuous elapsed percentage track indicating the build-up to lights out.</li>
                      <li><strong className="text-[var(--text)]">Precision Chronometer Rows:</strong> High-contrast session schedule with left-edge active tabs and clean 3-column telemetry formatting.</li>
                    </ul>
                  </div>
                )}
                {selectedVariant === 'baseline' && (
                  <div className="space-y-2 text-sm text-[var(--text)]">
                    <p className="font-semibold text-[var(--text-muted)]">
                      Current Baseline (Previous Box)
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      The original unified card with inline text countdown and standard plain list items. Provided for direct baseline contrast.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Side-by-Side Matrix View */
          <div className="max-w-[1560px] mx-auto w-full px-5 md:px-8 lg:px-12 py-8 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                Comparative Design Matrix
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Directly compare all three redesigned models side-by-side with live ticking countdowns and real session data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {/* Card 1: Option A */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-red-500 tracking-wider">
                      Option A
                    </span>
                    <h3 className="text-base font-bold text-[var(--text)]">Pit Wall Telemetry</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariant('pitwall')
                      setActiveTab('hero')
                    }}
                    className="px-2.5 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium hover:bg-red-500 hover:text-white transition-colors"
                  >
                    View in Hero
                  </button>
                </div>
                <TimerPitWall {...timerProps} />
                <div className="text-xs text-[var(--text-muted)] space-y-1 bg-[var(--surface-1)] p-3 rounded-md border border-[var(--border)]">
                  <div>• 4 separate digital cubes with monospaced digits</div>
                  <div>• Color-coded session badges (FP, Quali, Race)</div>
                  <div>• F1 red telemetry top accent notch</div>
                </div>
              </div>

              {/* Card 2: Option B */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[var(--text)] tracking-wider">
                      Option B
                    </span>
                    <h3 className="text-base font-bold text-[var(--text)]">Minimalist Floating</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariant('minimalist')
                      setActiveTab('hero')
                    }}
                    className="px-2.5 py-1 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] text-xs font-medium hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
                  >
                    View in Hero
                  </button>
                </div>
                <div className="p-4 rounded-lg bg-[var(--surface-1)]/50 border border-[var(--border)]">
                  <TimerMinimalist {...timerProps} />
                </div>
                <div className="text-xs text-[var(--text-muted)] space-y-1 bg-[var(--surface-1)] p-3 rounded-md border border-[var(--border)]">
                  <div>• Borderless, matches Dashboard v2's airy layout</div>
                  <div>• Huge 48px high-contrast numbers</div>
                  <div>• Horizontal Weekend Timeline Ribbon (with list toggle)</div>
                </div>
              </div>

              {/* Card 3: Option C */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
                      Option C
                    </span>
                    <h3 className="text-base font-bold text-[var(--text)]">Official Timekeeper</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariant('timekeeper')
                      setActiveTab('hero')
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    View in Hero
                  </button>
                </div>
                <TimerTimekeeper {...timerProps} />
                <div className="text-xs text-[var(--text-muted)] space-y-1 bg-[var(--surface-1)] p-3 rounded-md border border-[var(--border)]">
                  <div>• Frosted obsidian glass with hairline metallic edges</div>
                  <div>• Continuous elapsed percentage countdown bar</div>
                  <div>• Precision telemetry table with glowing active dot</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default TimerShowcasePage
