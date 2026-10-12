import React, { useEffect, useState } from 'react'
import { SessionService, type CountdownState } from '@/api/sessionService'
import { cn } from '@/lib/utils'
import { Clock, Check } from 'lucide-react'
import type { TimerVariantProps } from './types'

export const TimerTimekeeper: React.FC<TimerVariantProps> = ({
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

  // Progress estimation (e.g. 7-day countdown window)
  const totalWindowSec = 7 * 24 * 3600
  const remainingSec = state?.totalSeconds ?? 0
  const progressPercent = Math.min(
    100,
    Math.max(5, Math.round(((totalWindowSec - remainingSec) / totalWindowSec) * 100))
  )

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-zinc-900/90 to-black/95 border border-white/15 dark:border-white/20 text-white shadow-2xl w-full">
      {/* Precision Metallic Hairline Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60" />

      <div className="p-5 sm:p-6 lg:p-7 flex flex-col gap-6">
        {/* Luxury Timekeeper Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Clock className="w-3 h-3 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
                Official Timekeeper
              </div>
              <div className="text-[12px] font-bold tracking-tight text-white/90">
                Championship Master Clock
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{timezoneAbbr}</span>
          </div>
        </div>

        {/* Master Countdown Split Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-zinc-400 mb-2">
            <span>{isSessionLive ? 'Current Event' : `Next Event: ${nextSession?.title || 'Race'}`}</span>
            <span className="font-mono text-[10px] text-emerald-400">CHRONOMETER</span>
          </div>

          {isSessionLive ? (
            <div className="flex items-center justify-center py-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-mono font-bold text-2xl tracking-widest animate-pulse">
              TRACK ACTIVE • GREEN FLAG
            </div>
          ) : !state || state.isExpired ? (
            <div className="text-3xl font-light text-zinc-500 py-4">—</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col items-center flex-1">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums">
                    {String(state.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mt-1">
                    Days
                  </span>
                </div>
                <span className="text-lg font-mono text-zinc-600">:</span>
                <div className="flex flex-col items-center flex-1">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums">
                    {String(state.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mt-1">
                    Hours
                  </span>
                </div>
                <span className="text-lg font-mono text-zinc-600">:</span>
                <div className="flex flex-col items-center flex-1">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums">
                    {String(state.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mt-1">
                    Minutes
                  </span>
                </div>
                <span className="text-lg font-mono text-zinc-600">:</span>
                <div className="flex flex-col items-center flex-1">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                    {String(state.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 mt-1">
                    Seconds
                  </span>
                </div>
              </div>

              {/* Countdown Progress Track */}
              <div className="flex flex-col gap-1.5">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>Weekend Build-Up</span>
                  <span>{progressPercent}% Complete</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* High-Precision Session Schedule Table */}
        <div className="border-t border-white/10 pt-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 font-semibold mb-3 flex items-center justify-between">
            <span>Weekend Official Schedule</span>
            <span className="font-mono text-zinc-500">{weekendSessions.length} Sessions</span>
          </div>

          <div className="flex flex-col divide-y divide-white/5">
            {weekendSessions.map((session) => {
              const isPast = session.isFinished
              const isNext = !isPast && session.id === nextSession?.id

              return (
                <div
                  key={session.id}
                  className={cn(
                    'py-2.5 px-3 rounded-md flex items-center justify-between text-xs transition-all duration-150 relative group',
                    isNext
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-400 text-white'
                      : isPast
                      ? 'opacity-40 text-zinc-400'
                      : 'hover:bg-white/5 text-zinc-200'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        isNext ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : isPast ? 'bg-zinc-600' : 'bg-white/30'
                      )}
                    />
                    <span className={cn('font-medium truncate', isNext && 'font-bold text-white')}>
                      {session.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <span className="text-zinc-400 uppercase text-[10px]">
                      {formatWeekday(session.startTimeIso)}
                    </span>
                    <span
                      className={cn(
                        'tabular-nums text-right w-[7ch]',
                        isNext ? 'text-emerald-400 font-bold' : 'text-zinc-200 font-semibold'
                      )}
                    >
                      {formatTime(session.startTimeIso)}
                    </span>
                    {isPast && <Check className="w-3 h-3 text-emerald-500/70 shrink-0" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
