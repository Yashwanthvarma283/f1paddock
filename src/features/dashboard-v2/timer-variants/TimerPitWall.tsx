import React, { useEffect, useState } from 'react'
import { SessionService, type CountdownState } from '@/api/sessionService'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Radio } from 'lucide-react'
import type { TimerVariantProps } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

const DigitCube: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const str = pad(value)
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 sm:px-3 bg-black/20 dark:bg-black/60 border border-[var(--border)] dark:border-white/10 rounded-[6px] shadow-inner relative group transition-all duration-200 hover:border-[var(--accent)]/40">
      <div className="flex items-center text-[22px] sm:text-[28px] md:text-[32px] font-mono font-bold tracking-tight text-[var(--text)] leading-none">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={str}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="tabular-nums"
          >
            {str}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] font-semibold mt-1.5 select-none">
        {label}
      </span>
    </div>
  )
}

export const TimerPitWall: React.FC<TimerVariantProps> = ({
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

  const getSessionBadge = (type: string) => {
    switch (type) {
      case 'RACE':
        return { label: 'RACE', className: 'bg-red-500/15 text-red-500 border-red-500/40 font-bold' }
      case 'QUALIFYING':
        return { label: 'QUAL', className: 'bg-purple-500/15 text-purple-400 border-purple-500/40 font-semibold' }
      case 'SPRINT':
        return { label: 'SPRINT', className: 'bg-amber-500/15 text-amber-500 border-amber-500/40 font-semibold' }
      case 'SQ':
        return { label: 'SQ', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
      case 'FP1':
        return { label: 'FP1', className: 'bg-zinc-500/10 text-[var(--text-muted)] border-[var(--border)]' }
      case 'FP2':
        return { label: 'FP2', className: 'bg-zinc-500/10 text-[var(--text-muted)] border-[var(--border)]' }
      case 'FP3':
        return { label: 'FP3', className: 'bg-zinc-500/10 text-[var(--text-muted)] border-[var(--border)]' }
      default:
        return { label: type, className: 'bg-zinc-500/10 text-[var(--text-muted)] border-[var(--border)]' }
    }
  }

  return (
    <div className="relative flex flex-col bg-[var(--surface-1)]/95 dark:bg-[#0f1115]/95 border border-[var(--border)] dark:border-white/15 rounded-[8px] overflow-hidden backdrop-blur-xl shadow-xl w-full">
      {/* Top Racing Red Accent Notch */}
      <div className="h-[3px] w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.5)]" />

      <div className="p-5 sm:p-6 lg:p-7 flex flex-col gap-6">
        {/* Telemetry Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)]/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text)]">
              Pit Wall // Telemetry
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-red-500/10 border border-red-500/20 text-[10px] font-mono font-semibold uppercase text-red-500 tracking-wider">
            {isSessionLive ? (
              <span className="flex items-center gap-1 animate-pulse">
                <Radio className="w-3 h-3 text-red-500" />
                LIVE ON TRACK
              </span>
            ) : (
              <span>NEXT: {nextSession?.title || 'RACE'}</span>
            )}
          </div>
        </div>

        {/* Digital Split Timing Cubes */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Countdown To Lights Out</span>
            <span className="text-[10px] font-mono opacity-60">SYNCED GPS</span>
          </div>

          {isSessionLive ? (
            <div className="flex items-center justify-center py-6 bg-red-500/10 border border-red-500/30 rounded-[6px] text-red-500 font-mono font-black text-2xl tracking-widest animate-pulse">
              SESSION IS LIVE
            </div>
          ) : !state || state.isExpired ? (
            <div className="flex items-center justify-center py-6 bg-black/10 rounded-[6px] font-mono text-2xl text-[var(--text-muted)]">
              — : — : — : —
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <DigitCube value={state.days} label="Days" />
              <span className="text-xl font-mono font-bold text-[var(--text-muted)] opacity-50 select-none">:</span>
              <DigitCube value={state.hours} label="Hours" />
              <span className="text-xl font-mono font-bold text-[var(--text-muted)] opacity-50 select-none">:</span>
              <DigitCube value={state.minutes} label="Mins" />
              <span className="text-xl font-mono font-bold text-[var(--text-muted)] opacity-50 select-none">:</span>
              <DigitCube value={state.seconds} label="Secs" />
            </div>
          )}
        </div>

        {/* Weekend Timeline */}
        <div className="border-t border-[var(--border)]/70 pt-4">
          <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <span>Weekend Timeline ({timezoneAbbr})</span>
            <span className="text-[10px] font-mono opacity-60">{weekendSessions.length} SESSIONS</span>
          </div>

          <ul className="flex flex-col gap-1.5">
            {weekendSessions.map((session) => {
              const isPast = session.isFinished
              const isNext = !isPast && session.id === nextSession?.id
              const badge = getSessionBadge(session.type)

              return (
                <li
                  key={session.id}
                  className={cn(
                    'h-[38px] px-2.5 rounded-[5px] flex items-center justify-between text-xs transition-all duration-150',
                    isNext
                      ? 'bg-red-500/10 dark:bg-red-950/25 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                      : isPast
                      ? 'opacity-40 bg-transparent hover:opacity-60'
                      : 'hover:bg-[var(--surface-2)]/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono border uppercase tracking-wider',
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>
                    <span className={cn('font-medium truncate', isNext && 'text-[var(--text)] font-semibold')}>
                      {session.title}
                    </span>
                    {isNext && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.2 rounded">
                        Next
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">
                      {formatWeekday(session.startTimeIso)}
                    </span>
                    <span
                      className={cn(
                        'tabular-nums text-right w-[7ch]',
                        isNext ? 'text-red-500 font-bold' : 'text-[var(--text)] font-semibold'
                      )}
                    >
                      {formatTime(session.startTimeIso)}
                    </span>
                    {isPast && <Check className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
