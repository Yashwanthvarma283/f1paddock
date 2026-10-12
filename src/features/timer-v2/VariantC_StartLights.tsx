import React from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from 'motion/react'
import type { WeekendTimerProps } from './types'
import { deriveTimerState, formatSessionTime, formatSessionWeekday, useLiveClock } from './helpers'

const pad = (n: number) => String(n).padStart(2, '0')

export const VariantC_StartLights: React.FC<WeekendTimerProps> = ({
  sessions,
  clockIso,
  timezoneLabel,
  timeFormat = '24h',
  className,
}) => {
  const currentClock = useLiveClock(clockIso)
  const state = deriveTimerState(sessions, currentClock)
  const shouldReduceMotion = useReducedMotion()

  // In the final 5 seconds before a session, start lights sequence 1-by-1
  const isFinalFiveSeconds = state.stateMode === 'lt1m' && state.totalSeconds <= 5 && state.totalSeconds > 0
  const finalSequenceLitCount = isFinalFiveSeconds ? 5 - state.totalSeconds + 1 : 0

  return (
    <div
      data-testid="timer-root"
      className={cn(
        'flex flex-col bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-4 sm:p-5 w-full text-[var(--text)]',
        className
      )}
    >
      {/* Header: Status and Timezone (shown once) */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] truncate">
          {state.statusHeading}
        </span>
        <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] shrink-0">
          {timezoneLabel}
        </span>
      </div>

      {/* F1 Start Lights Gantry (5 lights in a row) */}
      <div className="flex flex-col items-center justify-center p-3 sm:p-3.5 bg-[var(--surface-2)]/60 border border-[var(--border-subtle)] rounded-[4px] mb-4">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {sessions.slice(0, 5).map((session, idx) => {
            const isCompleted = session.isFinished
            const isNext = !isCompleted && session.id === state.targetSession?.id

            // If final 5 seconds sequence is running (and not reduced motion)
            const isLitInFinalSeq = isFinalFiveSeconds && !shouldReduceMotion && idx < finalSequenceLitCount
            const isSolidLit = isLitInFinalSeq || isCompleted

            return (
              <div key={session.id} className="flex flex-col items-center gap-1.5">
                <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full">
                  {/* Outline / Ring for next session */}
                  {isNext && !isSolidLit && (
                    <div
                      className={cn(
                        'absolute inset-0 rounded-full border border-[var(--accent)]',
                        shouldReduceMotion ? 'opacity-100' : 'animate-[pulse_1.2s_ease-in-out_infinite]'
                      )}
                    />
                  )}

                  {/* Light circle */}
                  <div
                    className={cn(
                      'w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors duration-200 border',
                      isSolidLit
                        ? 'bg-[var(--accent)] border-[var(--accent)]'
                        : 'bg-[var(--surface-1)] border-[var(--border-subtle)]'
                    )}
                  />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.05em] text-[var(--text-muted)]">
                  {session.type}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Countdown Digits */}
      <div className="mb-4">
        {state.stateMode === 'running' ? (
          <div className="py-2">
            <div className="text-[22px] sm:text-[26px] font-mono font-medium tracking-tight text-[var(--text)]">
              In progress
            </div>
            {state.followingSession && (
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Next: {state.followingSession.title} at {formatSessionTime(state.followingSession.startTimeIso, timeFormat)}
              </div>
            )}
          </div>
        ) : state.stateMode === 'completed' ? (
          <div className="py-2 text-[18px] sm:text-[20px] font-medium text-[var(--text-muted)]">
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

      {/* Two-Column Session List */}
      <div className="border-t border-[var(--border-subtle)] pt-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {sessions.map((session) => {
            const isCompleted = session.isFinished
            const isTarget = !isCompleted && session.id === state.targetSession?.id

            return (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between text-[12px] py-1 border-b border-[var(--border-subtle)]/50 sm:border-b-0',
                  isCompleted && 'opacity-40 text-[var(--text-muted)]',
                  isTarget && 'font-semibold text-[var(--text)]'
                )}
              >
                <div className="flex items-center gap-1.5 truncate pr-1">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                    {formatSessionWeekday(session.startTimeIso)}
                  </span>
                  <span className="truncate">{session.title}</span>
                </div>
                <span className="font-mono text-[11px] shrink-0 tabular-nums">
                  {formatSessionTime(session.startTimeIso, timeFormat)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
