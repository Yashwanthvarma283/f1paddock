import React, { useState, useEffect, useRef } from 'react'
import type { WeekendSession } from '@/api/types'
import { cn } from '@/lib/utils'
import { useReducedMotion } from 'motion/react'
import {
  DRAW_DURATION_MS,
  getRingCycleDurationMs,
  getGantryCycleDurationMs,
} from './timerConstants'


const pad = (n: number) => String(n).padStart(2, '0')

function getShortSessionName(session: WeekendSession): string {
  switch (session.type) {
    case 'FP1':
      return 'FP1'
    case 'FP2':
      return 'FP2'
    case 'FP3':
      return 'FP3'
    case 'QUAL':
      return 'QUAL'
    case 'SQ':
      return 'SQ'
    case 'SPRINT':
      return 'SPR'
    case 'RACE':
      return 'RACE'
    default:
      return session.type
  }
}

function formatTime(iso: string, format: '12h' | '24h' = '24h'): string {
  try {
    const d = new Date(iso)
    if (format === '12h') {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '—'
  }
}

function formatWeekday(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
  } catch {
    return '—'
  }
}

export interface StartLightsTimerProps {
  sessions: WeekendSession[]
  clockIso?: string
  now?: Date
  timezoneLabel: string
  timeFormat?: '12h' | '24h'
  onExpire?: () => void
  className?: string
}

export const StartLightsTimer: React.FC<StartLightsTimerProps> = ({
  sessions,
  clockIso,
  now,
  timezoneLabel,
  timeFormat = '24h',
  onExpire,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion()

  const incomingIso = clockIso || (now ? now.toISOString() : null)
  const [baseIso, setBaseIso] = useState<string>(
    () => incomingIso || new Date().toISOString()
  )
  const [elapsedSec, setElapsedSec] = useState(0)

  // Sync when external clock/now changes
  useEffect(() => {
    if (incomingIso && incomingIso !== baseIso) {
      setBaseIso(incomingIso)
      setElapsedSec(0)
    }
  }, [incomingIso, baseIso])

  // Ticks locally every second so the parent hero does NOT re-render
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [baseIso])

  const currentClockMs = new Date(baseIso).getTime() + elapsedSec * 1000

  // Take the 5 sessions of the weekend
  const displayedSessions = sessions.slice(0, 5)

  // 1. Check if a session is actively running
  const activeSession =
    displayedSessions.find((s) => {
      if (s.isLive) return true
      const start = new Date(s.startTimeIso).getTime()
      const end = s.endTimeIso ? new Date(s.endTimeIso).getTime() : start + 90 * 60 * 1000
      return currentClockMs >= start && currentClockMs < end
    }) || null

  // 2. Determine completed status for each session
  const isSessionComplete = (s: WeekendSession) => {
    if (s.isFinished) return true
    if (s.isLive) return false
    const end = s.endTimeIso
      ? new Date(s.endTimeIso).getTime()
      : new Date(s.startTimeIso).getTime() + 90 * 60 * 1000
    return currentClockMs >= end
  }

  const completedMap = new Map<string, boolean>()
  displayedSessions.forEach((s) => {
    completedMap.set(s.id, isSessionComplete(s))
  })

  // 3. Upcoming sessions
  const upcomingSessions = displayedSessions.filter((s) => {
    const isComp = completedMap.get(s.id)
    const start = new Date(s.startTimeIso).getTime()
    return !isComp && start > currentClockMs
  })

  const targetSession = activeSession ? activeSession : upcomingSessions[0] || null
  const followingSession = activeSession
    ? displayedSessions[displayedSessions.findIndex((s) => s.id === activeSession.id) + 1] || null
    : upcomingSessions[1] || null

  const isWeekendComplete = displayedSessions.length > 0 && displayedSessions.every((s) => completedMap.get(s.id))
  const isSessionRunning = Boolean(activeSession)

  // Countdown calculations
  const targetTimeMs = targetSession ? new Date(targetSession.startTimeIso).getTime() : 0
  const diffSec = targetSession && !isSessionRunning
    ? Math.max(0, Math.floor((targetTimeMs - currentClockMs) / 1000))
    : 0

  const days = Math.floor(diffSec / 86400)
  const hours = Math.floor((diffSec % 86400) / 3600)
  const minutes = Math.floor((diffSec % 3600) / 60)
  const seconds = diffSec % 60

  // Call onExpire when countdown reaches 0
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])
  const hasExpiredRef = useRef(false)

  useEffect(() => {
    if (!targetSession || isSessionRunning || isWeekendComplete) return
    if (diffSec === 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true
      onExpireRef.current?.()
    } else if (diffSec > 0) {
      hasExpiredRef.current = false
    }
  }, [diffSec, targetSession, isSessionRunning, isWeekendComplete])

  // Non-complete sessions for the start lights sequence
  const nonCompleteSessions = displayedSessions.filter((s) => !completedMap.get(s.id))
  const nonCompleteCount = nonCompleteSessions.length
  const gantryCycleDurationMs = getGantryCycleDurationMs(nonCompleteCount)

  // Check if race is currently live
  const isRaceLive = Boolean(
    activeSession &&
      (activeSession.title.toLowerCase().includes('race') ||
        activeSession.title.toLowerCase().includes('grand prix') ||
        activeSession.type === 'RACE')
  )

  // Headings
  let statusHeading = 'SCHEDULE'
  if (isSessionRunning && activeSession) {
    statusHeading = `NOW: ${activeSession.title.toUpperCase()}`
  } else if (isWeekendComplete) {
    statusHeading = 'WEEKEND COMPLETE'
  } else if (targetSession) {
    statusHeading = `NEXT: ${targetSession.title.toUpperCase()}`
  }

  return (
    <div
      data-testid="start-lights-timer"
      className={cn(
        'flex flex-col bg-[var(--surface-1)] border border-[var(--border)] rounded-[4px] p-5 lg:p-6 backdrop-blur-md w-full shadow-sm text-[var(--text)]',
        className
      )}
    >
      {/* Top Meta: Status Heading */}
      <div className="flex items-center justify-between gap-3 pb-2.5 mb-3.5 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] truncate">
          {statusHeading}
        </span>
      </div>

      {/* 1. Start Lights Row: 5 double-light columns like the real F1 start gantry */}
      <div className="flex items-center justify-start gap-2.5 sm:gap-3.5 mb-4" data-testid="start-lights-row">
        {displayedSessions.map((session) => {
          const isComp = Boolean(completedMap.get(session.id))
          const isLiveSession = Boolean(activeSession && session.id === activeSession.id && !isRaceLive)
          const nonCompleteIndex = nonCompleteSessions.findIndex((s) => s.id === session.id)

          // State determination:
          // 1. Race live or Weekend complete: ALL lights solid ON
          // 2. Already finished: permanently ON
          // 3. Live session: blinks 1s on, 1s off
          // 4. Other session during a live session: completely OFF
          // 5. Idle sequence (no live session): sequence from 1st to last set every 3s, hold 5s, off, repeat
          const isSolidOn = isRaceLive || isWeekendComplete || isComp

          let lightStyle: React.CSSProperties = {}
          let lightClasses = ''

          if (isSolidOn) {
            lightClasses = 'bg-[var(--accent)] border-[var(--accent)] shadow-[0_0_10px_rgba(235,0,40,0.6)]'
          } else if (isLiveSession) {
            if (shouldReduceMotion) {
              lightClasses = 'bg-[var(--accent)] border-[var(--accent)] shadow-[0_0_10px_rgba(235,0,40,0.6)]'
            } else {
              lightStyle = {
                animation: 'dv2-start-light-blink 2s steps(1, start) infinite',
              }
            }
          } else if (isSessionRunning) {
            // While another session is live, future sessions stay completely OFF
            lightClasses = 'bg-[var(--surface-2)]/30 border-[var(--border-subtle)] opacity-30'
          } else {
            // Idle state: sequential F1 start light sequence
            if (shouldReduceMotion) {
              lightClasses =
                nonCompleteIndex === 0
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'bg-[var(--surface-2)]/30 border-[var(--border-subtle)]'
            } else if (nonCompleteIndex >= 0 && nonCompleteCount > 0) {
              lightStyle = {
                animationName: `dv2-gantry-seq-${nonCompleteCount}-${nonCompleteIndex}`,
                animationDuration: `${gantryCycleDurationMs}ms`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }
            } else {
              lightClasses = 'bg-[var(--surface-2)]/30 border-[var(--border-subtle)]'
            }
          }

          const renderLight = (position: 'top' | 'bottom') => (
            <div
              key={position}
              data-testid={position === 'top' ? `start-light-${session.id}` : `start-light-${session.id}-bottom`}
              data-complete={isSolidOn ? 'true' : 'false'}
              className={cn(
                'relative flex items-center justify-center w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] rounded-full border-2 transition-colors duration-150',
                lightClasses
              )}
              style={lightStyle}
            >
              {/* Inner subtle bulb core */}
              <div className="w-[7px] h-[7px] sm:w-[9px] sm:h-[9px] rounded-full bg-black/25 pointer-events-none" />
            </div>
          )

          return (
            <div key={session.id} className="flex flex-col items-center gap-1.5 shrink-0">
              {/* Double light housing pod */}
              <div className="flex flex-col items-center gap-1.5 p-1 rounded-[4px] bg-[var(--surface-2)]/30 border border-[var(--border-subtle)]/50">
                {renderLight('top')}
                {renderLight('bottom')}
              </div>

              {/* Session short code label at minimum 11px */}
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {getShortSessionName(session)}
              </span>
            </div>
          )
        })}
      </div>

      {/* 2. Countdown Digits Area */}
      <div className="mb-4" data-testid="countdown-display">
        {isSessionRunning ? (
          <div className="py-1">
            <div className="text-[26px] sm:text-[32px] font-semibold text-[var(--text)] tracking-tight leading-none">
              In progress
            </div>
            {followingSession && (
              <div className="text-[11px] text-[var(--text-muted)] mt-2">
                Following: {followingSession.title} at {formatTime(followingSession.startTimeIso, timeFormat)}
              </div>
            )}
          </div>
        ) : isWeekendComplete ? (
          <div className="py-1 text-[22px] sm:text-[26px] font-semibold text-[var(--text-muted)] tracking-tight leading-none">
            Weekend complete
          </div>
        ) : (
          <div className="flex items-baseline gap-3 sm:gap-4 dv2-fig tabular-nums" aria-label="Upcoming session countdown">
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[34px] font-bold text-[var(--text)] leading-none">
                {pad(days)}
              </span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                DAYS
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[34px] font-bold text-[var(--text)] leading-none">
                {pad(hours)}
              </span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                HRS
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[34px] font-bold text-[var(--text)] leading-none">
                {pad(minutes)}
              </span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                MIN
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[34px] font-bold text-[var(--text)] leading-none">
                {pad(seconds)}
              </span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                SEC
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Session List in Two Columns */}
      <div className="border-t border-[var(--border-subtle)] pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-2">
          {displayedSessions.map((session) => {
            const isComp = Boolean(completedMap.get(session.id))
            const isTarget = !isComp && session.id === targetSession?.id && !isSessionRunning
            const isActive = isSessionRunning && session.id === activeSession?.id

            return (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between text-[12px] py-0.5 border-b border-[var(--border-subtle)]/40 sm:border-b-0 pb-1.5 sm:pb-0',
                  isComp && 'opacity-40 text-[var(--text-muted)]',
                  (isTarget || isActive) && 'font-semibold text-[var(--text)]'
                )}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isActive
                        ? 'bg-[var(--accent)]'
                        : isTarget
                        ? 'bg-[var(--accent)]'
                        : isComp
                        ? 'bg-transparent'
                        : 'bg-[var(--text-muted)]/50'
                    )}
                  />
                  <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] shrink-0">
                    {formatWeekday(session.startTimeIso)}
                  </span>
                  <span className="truncate">{session.title}</span>
                </div>
                <span className="dv2-fig font-mono text-[12px] shrink-0 tabular-nums">
                  {formatTime(session.startTimeIso, timeFormat)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StartLightsTimer
