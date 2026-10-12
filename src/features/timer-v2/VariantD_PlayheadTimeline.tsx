import React from 'react'
import { cn } from '@/lib/utils'
import type { WeekendTimerProps } from './types'
import { deriveTimerState, formatSessionTime, formatSessionWeekday, useLiveClock } from './helpers'

const pad = (n: number) => String(n).padStart(2, '0')

export const VariantD_PlayheadTimeline: React.FC<WeekendTimerProps> = ({
  sessions,
  clockIso,
  timezoneLabel,
  timeFormat = '24h',
  className,
}) => {
  const currentClock = useLiveClock(clockIso)
  const state = deriveTimerState(sessions, currentClock)

  // Calculate timeline positions
  const { progressPercent, sessionPositions } = React.useMemo(() => {
    if (sessions.length < 2) {
      return { progressPercent: 0, sessionPositions: [] }
    }
    const firstStart = new Date(sessions[0].startTimeIso).getTime()
    const lastSession = sessions[sessions.length - 1]
    const lastEnd = lastSession.endTimeIso
      ? new Date(lastSession.endTimeIso).getTime()
      : new Date(lastSession.startTimeIso).getTime() + 2 * 3600 * 1000
    const totalDuration = lastEnd - firstStart
    const nowMs = new Date(currentClock).getTime()

    const rawProgress = Math.max(0, Math.min(1, (nowMs - firstStart) / totalDuration))
    const progressPercent = Math.round(rawProgress * 100)

    const sessionPositions = sessions.map((s, index) => {
      const sTime = new Date(s.startTimeIso).getTime()
      const ratio = Math.max(0, Math.min(1, (sTime - firstStart) / totalDuration))
      return {
        ...s,
        percent: Math.round(ratio * 100),
        isAlternateAbove: index % 2 === 0,
      }
    })

    return { progressPercent, sessionPositions }
  }, [sessions, currentClock])

  return (
    <div
      data-testid="timer-root"
      className={cn(
        'flex flex-col bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-5 sm:p-6 w-full text-[var(--text)]',
        className
      )}
    >
      {/* Header: Status and Timezone (shown once) */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] truncate">
          {state.statusHeading}
        </span>
        <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] shrink-0">
          {timezoneLabel}
        </span>
      </div>

      {/* Countdown Single-Line Header */}
      <div className="mb-6">
        {state.stateMode === 'running' ? (
          <div className="flex items-baseline justify-between">
            <span className="text-[24px] font-mono font-medium tracking-tight text-[var(--text)]">
              In progress
            </span>
            {state.followingSession && (
              <span className="text-[11px] text-[var(--text-muted)]">
                Next: {state.followingSession.title}
              </span>
            )}
          </div>
        ) : state.stateMode === 'completed' ? (
          <div className="text-[20px] font-medium text-[var(--text-muted)]">
            Weekend complete
          </div>
        ) : (
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            {state.days > 0 && (
              <span className="inline-flex items-baseline">
                <span className="text-[26px] sm:text-[32px] font-medium leading-none">
                  {pad(state.days)}
                </span>
                <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5 mr-2">
                  D
                </span>
              </span>
            )}
            <span className="inline-flex items-baseline">
              <span className="text-[26px] sm:text-[32px] font-medium leading-none">
                {pad(state.hours)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5 mr-2">
                H
              </span>
            </span>
            <span className="inline-flex items-baseline">
              <span className="text-[26px] sm:text-[32px] font-medium leading-none">
                {pad(state.minutes)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5 mr-2">
                M
              </span>
            </span>
            <span className="inline-flex items-baseline">
              <span className="text-[26px] sm:text-[32px] font-medium leading-none">
                {pad(state.seconds)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5">
                S
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Desktop Horizontal Playhead Track (Hidden on mobile) */}
      <div className="hidden sm:flex flex-col relative py-8 px-2 my-2">
        {/* Track Line */}
        <div className="h-[2px] w-full bg-[var(--border-subtle)] relative">
          {/* Completed Stretch */}
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Thin Vertical Playhead Showing NOW */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-6 bg-[var(--text)] transition-all duration-300 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          >
            <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-mono font-bold tracking-wider uppercase text-[var(--text)]">
              NOW
            </span>
          </div>

          {/* Session Markers Positioned by Real Time, Alternating Above and Below */}
          {sessionPositions.map((s) => {
            const isCompleted = s.isFinished
            const isTarget = !isCompleted && s.id === state.targetSession?.id

            return (
              <div
                key={s.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${s.percent}%` }}
              >
                {/* Dot */}
                <div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full border transition-colors',
                    isCompleted
                      ? 'bg-[var(--accent)] border-[var(--accent)]'
                      : isTarget
                      ? 'bg-[var(--text)] border-[var(--text)] ring-2 ring-[var(--surface-1)]'
                      : 'bg-[var(--surface-1)] border-[var(--border-subtle)]'
                  )}
                />

                {/* Alternating Label: Above vs Below to avoid collision */}
                <div
                  className={cn(
                    'absolute w-max text-[10px] font-mono leading-tight flex flex-col items-center pointer-events-none',
                    s.isAlternateAbove ? '-top-7' : 'top-3.5',
                    isCompleted && 'opacity-40 text-[var(--text-muted)]',
                    isTarget && 'font-bold text-[var(--text)]'
                  )}
                >
                  <span>{s.type}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">
                    {formatSessionTime(s.startTimeIso, timeFormat)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Vertical Timeline (Shown on small screens <640px) */}
      <div className="sm:hidden flex flex-col border-t border-[var(--border-subtle)] pt-3">
        <div className="relative pl-4 border-l border-[var(--border-subtle)] space-y-3">
          {sessions.map((session) => {
            const isCompleted = session.isFinished
            const isTarget = !isCompleted && session.id === state.targetSession?.id
            const isLive = session.isLive || session.id === state.activeSession?.id

            return (
              <div key={session.id} className="relative flex items-center justify-between text-[12px]">
                {/* Marker Node on line */}
                <div
                  className={cn(
                    'absolute -left-[21px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border',
                    isCompleted
                      ? 'bg-[var(--accent)] border-[var(--accent)]'
                      : isTarget
                      ? 'bg-[var(--text)] border-[var(--text)]'
                      : 'bg-[var(--surface-1)] border-[var(--border-subtle)]'
                  )}
                />
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                    {formatSessionWeekday(session.startTimeIso)}
                  </span>
                  <span className={cn('truncate', isTarget && 'font-semibold')}>{session.title}</span>
                </div>
                <span className="font-mono text-[11px] shrink-0 tabular-nums text-[var(--text-muted)]">
                  {isLive ? 'NOW' : formatSessionTime(session.startTimeIso, timeFormat)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
