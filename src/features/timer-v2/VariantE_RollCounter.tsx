import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { WeekendTimerProps } from './types'
import { deriveTimerState, formatSessionTime, formatSessionWeekday, useLiveClock } from './helpers'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Animated rolling digit that rolls vertically to the next value.
 * Static text when reduced motion is preferred.
 */
const RollDigit: React.FC<{ char: string; reduceMotion: boolean }> = ({ char, reduceMotion }) => {
  if (reduceMotion) {
    return <span className="tabular-nums">{char}</span>
  }

  return (
    <div className="inline-block relative w-[0.58em] h-[1em] overflow-hidden leading-none">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0, position: 'absolute', top: 0, left: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center tabular-nums"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

const RollGroup: React.FC<{ value: number; label: string; reduceMotion: boolean }> = ({
  value,
  label,
  reduceMotion,
}) => {
  const str = pad(value)
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center text-[28px] sm:text-[34px] font-mono font-medium tracking-tight text-[var(--text)] leading-none">
        {str.split('').map((char, i) => (
          <RollDigit key={i} char={char} reduceMotion={reduceMotion} />
        ))}
      </div>
      <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1.5 select-none">
        {label}
      </span>
    </div>
  )
}

export const VariantE_RollCounter: React.FC<WeekendTimerProps> = ({
  sessions,
  clockIso,
  timezoneLabel,
  timeFormat = '24h',
  className,
}) => {
  const currentClock = useLiveClock(clockIso)
  const state = deriveTimerState(sessions, currentClock)
  const shouldReduceMotion = useReducedMotion() ?? false
  const [isExpanded, setIsExpanded] = useState(false)

  // Top 3 sessions vs remaining sessions
  const visibleSessions = isExpanded ? sessions : sessions.slice(0, 3)
  const hasHiddenSessions = sessions.length > 3

  return (
    <div
      data-testid="timer-root"
      className={cn(
        'flex flex-col bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-5 sm:p-6 w-full text-[var(--text)]',
        className
      )}
    >
      {/* Header Eyebrow */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] truncate">
          {state.statusHeading}
        </span>
        <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] shrink-0">
          {timezoneLabel}
        </span>
      </div>

      {/* Large Single-Line Counter */}
      <div className="flex items-center justify-center py-2 mb-5">
        {state.stateMode === 'running' ? (
          <div className="flex flex-col items-center py-2">
            <span className="text-[24px] font-mono font-medium tracking-tight text-[var(--text)]">
              In progress
            </span>
            {state.followingSession && (
              <span className="text-[11px] text-[var(--text-muted)] mt-1">
                Following: {state.followingSession.title} at {formatSessionTime(state.followingSession.startTimeIso, timeFormat)}
              </span>
            )}
          </div>
        ) : state.stateMode === 'completed' ? (
          <div className="text-[20px] font-medium text-[var(--text-muted)] py-2">
            Weekend complete
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {state.days > 0 && (
              <>
                <RollGroup value={state.days} label="DAYS" reduceMotion={shouldReduceMotion} />
                <span className="text-xl font-mono text-[var(--text-muted)] opacity-40 -mt-4">:</span>
              </>
            )}
            <RollGroup value={state.hours} label="HRS" reduceMotion={shouldReduceMotion} />
            <span className="text-xl font-mono text-[var(--text-muted)] opacity-40 -mt-4">:</span>
            <RollGroup value={state.minutes} label="MIN" reduceMotion={shouldReduceMotion} />
            <span className="text-xl font-mono text-[var(--text-muted)] opacity-40 -mt-4">:</span>
            <RollGroup value={state.seconds} label="SEC" reduceMotion={shouldReduceMotion} />
          </div>
        )}
      </div>

      {/* Sessions List (Next 3 by default with expand control) */}
      <div className="border-t border-[var(--border-subtle)] pt-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)]">
            Schedule {isExpanded ? `(5 of 5)` : `(Next 3)`}
          </span>
          {hasHiddenSessions && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text)] transition-colors underline underline-offset-2"
            >
              {isExpanded ? 'Show less' : 'Full schedule'}
            </button>
          )}
        </div>

        <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
          {visibleSessions.map((session) => {
            const isCompleted = session.isFinished
            const isTarget = !isCompleted && session.id === state.targetSession?.id

            return (
              <li
                key={session.id}
                className={cn(
                  'h-[34px] flex items-center justify-between text-[13px]',
                  isCompleted && 'opacity-40 text-[var(--text-muted)]',
                  isTarget && 'font-semibold text-[var(--text)]'
                )}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] w-[3ch] shrink-0">
                    {formatSessionWeekday(session.startTimeIso)}
                  </span>
                  <span className="truncate">{session.title}</span>
                </div>
                <span className="font-mono text-[12px] tabular-nums shrink-0">
                  {formatSessionTime(session.startTimeIso, timeFormat)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
