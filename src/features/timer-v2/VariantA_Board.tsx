import React from 'react'
import { cn } from '@/lib/utils'
import type { WeekendTimerProps } from './types'
import { deriveTimerState, formatSessionTime, formatSessionWeekday, useLiveClock } from './helpers'

const pad = (n: number) => String(n).padStart(2, '0')

export const VariantA_Board: React.FC<WeekendTimerProps> = ({
  sessions,
  clockIso,
  timezoneLabel,
  timeFormat = '24h',
  className,
}) => {
  const currentClock = useLiveClock(clockIso)
  const state = deriveTimerState(sessions, currentClock)

  return (
    <div
      data-testid="timer-root"
      className={cn(
        'flex flex-col bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-4 sm:p-5 w-full text-[var(--text)]',
        className
      )}
    >
      {/* Header: Status & Timezone (shown once) */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] truncate">
          {state.statusHeading}
        </span>
        <span className="text-[11px] font-mono uppercase tracking-[0.05em] text-[var(--text-muted)] shrink-0">
          {timezoneLabel}
        </span>
      </div>

      {/* Countdown 4-Column Grid */}
      <div className="mb-3.5">
        {state.stateMode === 'running' ? (
          <div className="flex flex-col py-2.5 px-3 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-[4px]">
            <div className="text-[20px] sm:text-[22px] font-mono font-medium tracking-tight text-[var(--text)]">
              In progress
            </div>
            {state.followingSession && (
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Following: {state.followingSession.title} at {formatSessionTime(state.followingSession.startTimeIso, timeFormat)}
              </div>
            )}
          </div>
        ) : state.stateMode === 'completed' ? (
          <div className="py-4 px-4 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-[4px] text-center">
            <div className="text-[18px] sm:text-[20px] font-medium text-[var(--text-muted)]">
              Weekend complete
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 border border-[var(--border-subtle)] rounded-[4px] overflow-hidden bg-[var(--surface-2)]/40">
            {/* Days */}
            <div className="flex flex-col items-center justify-center py-2 border-r border-[var(--border-subtle)]">
              <span className="text-[22px] sm:text-[26px] font-mono font-medium tabular-nums leading-none">
                {pad(state.days)}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1">
                DAYS
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center justify-center py-2 border-r border-[var(--border-subtle)]">
              <span className="text-[22px] sm:text-[26px] font-mono font-medium tabular-nums leading-none">
                {pad(state.hours)}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1">
                HRS
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center justify-center py-2 border-r border-[var(--border-subtle)]">
              <span className="text-[22px] sm:text-[26px] font-mono font-medium tabular-nums leading-none">
                {pad(state.minutes)}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1">
                MIN
              </span>
            </div>

            {/* Seconds (With thin red tick above seconds column only) */}
            <div className="relative flex flex-col items-center justify-center py-2">
              <div className="absolute top-0 inset-x-0 flex justify-center">
                <span className="w-4 h-[2px] bg-[var(--accent)]" />
              </div>
              <span className="text-[22px] sm:text-[26px] font-mono font-medium tabular-nums leading-none">
                {pad(state.seconds)}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1">
                SEC
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule: Compact Rows */}
      <div className="border-t border-[var(--border-subtle)] pt-3">
        <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-1.5">
          Schedule
        </div>
        <ul className="flex flex-col">
          {sessions.map((session) => {
            const isCompleted = session.isFinished
            const isTarget = !isCompleted && session.id === state.targetSession?.id
            const isLive = session.isLive || session.id === state.activeSession?.id

            return (
              <li
                key={session.id}
                className={cn(
                  'h-[28px] sm:h-[30px] flex items-center justify-between text-[12px] border-b border-[var(--border-subtle)] last:border-b-0',
                  isCompleted && 'opacity-50 text-[var(--text-muted)]',
                  isTarget && 'font-semibold text-[var(--text)]'
                )}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] w-[3ch] shrink-0">
                    {formatSessionWeekday(session.startTimeIso)}
                  </span>
                  {isTarget && <span className="text-[var(--accent)] select-none">—</span>}
                  <span className="truncate">{session.title}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[12px]">
                  {isLive ? (
                    <span className="text-[var(--accent)] font-semibold uppercase text-[11px]">
                      Now
                    </span>
                  ) : isCompleted ? (
                    <span className="text-[var(--text-muted)] uppercase text-[11px]">
                      Done
                    </span>
                  ) : null}
                  <span className="tabular-nums text-right w-[7ch]">
                    {formatSessionTime(session.startTimeIso, timeFormat)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
