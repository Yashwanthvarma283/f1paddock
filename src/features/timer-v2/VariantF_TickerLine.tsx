import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import type { WeekendTimerProps } from './types'
import { deriveTimerState, formatSessionTime, formatSessionWeekday, useLiveClock } from './helpers'

const pad = (n: number) => String(n).padStart(2, '0')

export const VariantF_TickerLine: React.FC<WeekendTimerProps> = ({
  sessions,
  clockIso,
  timezoneLabel,
  timeFormat = '24h',
  className,
}) => {
  const currentClock = useLiveClock(clockIso)
  const state = deriveTimerState(sessions, currentClock)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate share of final 7 days elapsed
  const sevenDaysSec = 7 * 24 * 3600
  const remainingSec = state.totalSeconds
  const elapsedRatio = Math.max(0, Math.min(1, (sevenDaysSec - remainingSec) / sevenDaysSec))
  const elapsedPercent = Math.round(elapsedRatio * 100)

  return (
    <div
      data-testid="timer-root"
      className={cn(
        'flex flex-col w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-4 sm:p-5 text-[var(--text)] transition-all',
        className
      )}
    >
      {/* Primary Ticker Line: Single row on desktop, wraps cleanly on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3">
        {/* Left: Status & Session Name */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] uppercase tracking-[0.1em] font-mono text-[var(--text-muted)]">
            {state.statusHeading}
          </span>
        </div>

        {/* Middle: Tabular Countdown */}
        <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
          {state.stateMode === 'running' ? (
            <span className="text-[18px] sm:text-[22px] font-medium text-[var(--text)]">
              In progress
            </span>
          ) : state.stateMode === 'completed' ? (
            <span className="text-[16px] text-[var(--text-muted)]">
              Weekend complete
            </span>
          ) : (
            <div className="flex items-baseline gap-2">
              {state.days > 0 && (
                <span className="inline-flex items-baseline">
                  <span className="text-[20px] sm:text-[24px] font-medium leading-none">
                    {pad(state.days)}
                  </span>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] ml-0.5 mr-1.5">
                    D
                  </span>
                </span>
              )}
              <span className="inline-flex items-baseline">
                <span className="text-[20px] sm:text-[24px] font-medium leading-none">
                  {pad(state.hours)}
                </span>
                <span className="text-[10px] uppercase text-[var(--text-muted)] ml-0.5 mr-1.5">
                  H
                </span>
              </span>
              <span className="inline-flex items-baseline">
                <span className="text-[20px] sm:text-[24px] font-medium leading-none">
                  {pad(state.minutes)}
                </span>
                <span className="text-[10px] uppercase text-[var(--text-muted)] ml-0.5 mr-1.5">
                  M
                </span>
              </span>
              <span className="inline-flex items-baseline">
                <span className="text-[20px] sm:text-[24px] font-medium leading-none">
                  {pad(state.seconds)}
                </span>
                <span className="text-[10px] uppercase text-[var(--text-muted)] ml-0.5">
                  S
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Target Session Time & Expand Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {state.targetSession && (
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {formatSessionWeekday(state.targetSession.startTimeIso)}{' '}
              {formatSessionTime(state.targetSession.startTimeIso, timeFormat)} ({timezoneLabel})
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-mono uppercase text-[var(--text)] hover:underline underline-offset-2 shrink-0"
          >
            {isExpanded ? 'Hide schedule' : 'Schedule'}
          </button>
        </div>
      </div>

      {/* Progress Track: Share of final 7 days elapsed */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <div className="h-1 w-full bg-[var(--surface-2)] rounded-[2px] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${elapsedPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
          <span>Last 7 days</span>
          <span>{elapsedPercent}% elapsed</span>
        </div>
      </div>

      {/* Expandable Schedule Panel */}
      {isExpanded && (
        <div className="border-t border-[var(--border-subtle)] pt-3.5 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {sessions.map((s) => {
              const isCompleted = s.isFinished
              const isTarget = !isCompleted && s.id === state.targetSession?.id
              const isLive = s.isLive || s.id === state.activeSession?.id

              return (
                <div
                  key={s.id}
                  className={cn(
                    'p-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 flex flex-col justify-between text-xs',
                    isCompleted && 'opacity-40',
                    isTarget && 'border-[var(--text)] font-semibold'
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
                    <span>{formatSessionWeekday(s.startTimeIso)}</span>
                    {isLive && <span className="text-[var(--accent)] font-bold">NOW</span>}
                  </div>
                  <div className="truncate font-medium mb-1">{s.title}</div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)]">
                    {formatSessionTime(s.startTimeIso, timeFormat)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
