import React, { useEffect, useState } from 'react'
import { SessionService, type CountdownState } from '@/api/sessionService'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { TimerVariantProps } from './types'

export const TimerMinimalist: React.FC<TimerVariantProps> = ({
  countdownTarget,
  nextSession,
  isSessionLive,
  weekendSessions,
  timezoneAbbr,
  formatWeekday,
  formatTime,
  onExpire,
}) => {
  const [state, setState] = useState<CountdownState | null>(() =>
    countdownTarget ? SessionService.calculateCountdown(countdownTarget) : null
  )
  const [viewMode, setViewMode] = useState<'ribbon' | 'list'>('ribbon')

  useEffect(() => {
    if (!countdownTarget) return
    const id = setInterval(() => {
      const next = SessionService.calculateCountdown(countdownTarget)
      setState(next)
      if (next.isExpired) {
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [countdownTarget, onExpire])

  return (
    <div className="relative flex flex-col w-full">
      {/* Floating Eyebrow */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border)] dark:border-white/20">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--text-muted)]">
            {isSessionLive ? 'Session In Progress' : `Next Session: ${nextSession?.title || 'Race'}`}
          </span>
          {isSessionLive && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
          )}
        </div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          {timezoneAbbr}
        </div>
      </div>

      {/* Massive Bold Floating Ticker */}
      <div className="py-2 sm:py-3 mb-4">
        {isSessionLive ? (
          <div className="text-[36px] sm:text-[44px] font-black tracking-tight text-[var(--accent)] animate-pulse">
            LIVE NOW
          </div>
        ) : !state || state.isExpired ? (
          <div className="text-[36px] sm:text-[44px] font-light text-[var(--text-muted)]">—</div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {state.days > 0 && (
              <div className="flex items-baseline">
                <span className="text-[34px] sm:text-[42px] lg:text-[48px] font-black tracking-tight text-[var(--text)] dv2-fig leading-none">
                  {String(state.days).padStart(2, '0')}
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase text-[var(--text-muted)] ml-1 tracking-wider">
                  d
                </span>
              </div>
            )}
            <div className="flex items-baseline">
              <span className="text-[34px] sm:text-[42px] lg:text-[48px] font-black tracking-tight text-[var(--text)] dv2-fig leading-none">
                {String(state.hours).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm font-semibold uppercase text-[var(--text-muted)] ml-1 tracking-wider">
                h
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] sm:text-[42px] lg:text-[48px] font-black tracking-tight text-[var(--text)] dv2-fig leading-none">
                {String(state.minutes).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm font-semibold uppercase text-[var(--text-muted)] ml-1 tracking-wider">
                m
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] sm:text-[42px] lg:text-[48px] font-black tracking-tight text-[var(--text)] dv2-fig leading-none">
                {String(state.seconds).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm font-semibold uppercase text-[var(--text-muted)] ml-1 tracking-wider">
                s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher for Schedule */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)] dark:border-white/20">
        <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--text-muted)]">
          Weekend Itinerary
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('ribbon')}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider transition-colors',
              viewMode === 'ribbon'
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            Ribbon
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider transition-colors',
              viewMode === 'list'
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            List
          </button>
        </div>
      </div>

      {/* Ribbon Horizontal Timeline */}
      {viewMode === 'ribbon' ? (
        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-stretch gap-2 min-w-full">
            {weekendSessions.map((session) => {
              const isPast = session.isFinished
              const isNext = !isPast && session.id === nextSession?.id

              return (
                <div
                  key={session.id}
                  className={cn(
                    'flex-1 min-w-[90px] p-2.5 rounded-[4px] border flex flex-col justify-between transition-all duration-200',
                    isNext
                      ? 'border-[var(--text)] bg-[var(--surface-2)]/90 shadow-sm'
                      : isPast
                      ? 'border-[var(--border)]/40 bg-transparent opacity-45'
                      : 'border-[var(--border)] bg-[var(--surface-1)]/40 hover:border-[var(--border)]/80'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-semibold">
                      {formatWeekday(session.startTimeIso)}
                    </span>
                    {isPast && <Check className="w-3 h-3 text-emerald-500" />}
                    {isNext && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    )}
                  </div>

                  <div className="text-[13px] font-bold text-[var(--text)] leading-tight mb-1 truncate">
                    {session.type}
                  </div>

                  <div className="text-[11px] font-mono text-[var(--text-muted)] dv2-fig">
                    {formatTime(session.startTimeIso)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Vertical List mode */
        <ul className="flex flex-col">
          {weekendSessions.map((session) => {
            const isPast = session.isFinished
            const isNext = !isPast && session.id === nextSession?.id

            return (
              <li
                key={session.id}
                className={cn(
                  'h-[38px] flex items-center justify-between border-b border-[var(--border)]/60 last:border-b-0 text-xs',
                  isPast && 'opacity-40',
                  isNext && 'font-semibold text-[var(--text)]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isNext
                        ? 'bg-[var(--accent)] animate-pulse'
                        : isPast
                        ? 'bg-transparent'
                        : 'bg-[var(--border)]'
                    )}
                  />
                  <span>{session.title}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[var(--text-muted)] uppercase">
                    {formatWeekday(session.startTimeIso)}
                  </span>
                  <span className="dv2-fig font-semibold text-right w-[7ch]">
                    {formatTime(session.startTimeIso)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
