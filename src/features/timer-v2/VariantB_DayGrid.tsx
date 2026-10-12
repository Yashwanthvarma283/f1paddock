import React from 'react'
import { cn } from '@/lib/utils'
import type { WeekendSession } from '@/api/types'
import type { WeekendTimerProps } from './types'
import { deriveTimerState, formatSessionTime, formatSessionWeekday, useLiveClock } from './helpers'

const pad = (n: number) => String(n).padStart(2, '0')

export const VariantB_DayGrid: React.FC<WeekendTimerProps> = ({
  sessions,
  clockIso,
  timezoneLabel,
  timeFormat = '24h',
  className,
}) => {
  const currentClock = useLiveClock(clockIso)
  const state = deriveTimerState(sessions, currentClock)

  // Group sessions by day
  const sessionsByDay = React.useMemo(() => {
    const map = new Map<string, WeekendSession[]>()
    sessions.forEach((s) => {
      const day = formatSessionWeekday(s.startTimeIso)
      const list = map.get(day) || []
      list.push(s)
      map.set(day, list)
    })
    return Array.from(map.entries())
  }, [sessions])

  return (
    <div
      data-testid="timer-root"
      className={cn(
        'flex flex-col border border-[var(--border-subtle)] bg-[var(--surface-1)] rounded-[4px] p-5 w-full text-[var(--text)]',
        className
      )}
    >
      {/* Header Eyebrow */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] truncate">
          {state.statusHeading}
        </span>
        <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] shrink-0">
          {timezoneLabel}
        </span>
      </div>

      {/* Countdown Single-Row Line on Top */}
      <div className="mb-4">
        {state.stateMode === 'running' ? (
          <div className="flex items-baseline justify-between py-1">
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
          <div className="text-[20px] font-medium text-[var(--text-muted)] py-1">
            Weekend complete
          </div>
        ) : (
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            {state.days > 0 && (
              <span className="inline-flex items-baseline">
                <span className="text-[28px] sm:text-[34px] font-medium leading-none">
                  {pad(state.days)}
                </span>
                <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5 mr-2">
                  D
                </span>
              </span>
            )}
            <span className="inline-flex items-baseline">
              <span className="text-[28px] sm:text-[34px] font-medium leading-none">
                {pad(state.hours)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5 mr-2">
                H
              </span>
            </span>
            <span className="inline-flex items-baseline">
              <span className="text-[28px] sm:text-[34px] font-medium leading-none">
                {pad(state.minutes)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5 mr-2">
                M
              </span>
            </span>
            <span className="inline-flex items-baseline">
              <span className="text-[28px] sm:text-[34px] font-medium leading-none">
                {pad(state.seconds)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)] ml-0.5">
                S
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Schedule: 3 Day Columns on Desktop, Stacks as 3 Compact Rows on Mobile */}
      <div className="border-t border-[var(--border-subtle)] pt-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {sessionsByDay.map(([day, daySessions]) => (
            <div
              key={day}
              className="flex flex-col bg-[var(--surface-2)]/50 border border-[var(--border-subtle)] rounded-[4px] p-2.5 sm:p-3"
            >
              <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] pb-1.5 mb-1.5 border-b border-[var(--border-subtle)]">
                {day}
              </div>
              <ul className="flex flex-col gap-1.5">
                {daySessions.map((s) => {
                  const isCompleted = s.isFinished
                  const isTarget = !isCompleted && s.id === state.targetSession?.id
                  const isLive = s.isLive || s.id === state.activeSession?.id

                  return (
                    <li
                      key={s.id}
                      className={cn(
                        'flex items-center justify-between text-[12px]',
                        isCompleted && 'opacity-40 text-[var(--text-muted)]',
                        isTarget && 'font-semibold text-[var(--text)]'
                      )}
                    >
                      <div className="flex items-center gap-1 truncate pr-1">
                        {isTarget && <span className="text-[var(--accent)] select-none">•</span>}
                        <span className="truncate">{s.title}</span>
                      </div>
                      <span className="font-mono text-[11px] shrink-0 tabular-nums text-[var(--text-muted)]">
                        {isLive ? 'NOW' : formatSessionTime(s.startTimeIso, timeFormat)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
