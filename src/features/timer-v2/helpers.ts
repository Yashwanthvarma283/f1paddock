import { useState, useEffect } from 'react'
import type { WeekendSession } from '@/api/types'
import type { DerivedTimerState, TimerStateMode } from './types'

export function deriveTimerState(sessions: WeekendSession[], clockIso: string): DerivedTimerState {
  const now = new Date(clockIso).getTime()

  // 1. Check if any session is actively running
  const activeSession = sessions.find((s) => {
    if (s.isLive) return true
    const start = new Date(s.startTimeIso).getTime()
    const end = s.endTimeIso ? new Date(s.endTimeIso).getTime() : start + 3600 * 1000
    return now >= start && now < end
  }) || null

  if (activeSession) {
    const activeIndex = sessions.findIndex((s) => s.id === activeSession.id)
    const followingSession = activeIndex >= 0 && activeIndex + 1 < sessions.length
      ? sessions[activeIndex + 1]
      : null

    return {
      stateMode: 'running',
      targetSession: activeSession,
      activeSession,
      followingSession,
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      isLive: true,
      statusHeading: `NOW: ${activeSession.title.toUpperCase()}`,
    }
  }

  // 2. Find next upcoming session
  const upcomingSessions = sessions.filter((s) => {
    const start = new Date(s.startTimeIso).getTime()
    return !s.isFinished && start > now
  })

  if (upcomingSessions.length === 0) {
    // All sessions finished
    return {
      stateMode: 'completed',
      targetSession: null,
      activeSession: null,
      followingSession: null,
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isLive: false,
      statusHeading: 'Weekend complete',
    }
  }

  const targetSession = upcomingSessions[0]
  const targetTime = new Date(targetSession.startTimeIso).getTime()
  const diffSec = Math.max(0, Math.floor((targetTime - now) / 1000))

  let stateMode: TimerStateMode = 'gt24h'
  if (diffSec < 60) {
    stateMode = 'lt1m'
  } else if (diffSec < 3600) {
    stateMode = 'lt1h'
  } else if (diffSec < 86400) {
    stateMode = 'lt24h'
  }

  const days = Math.floor(diffSec / 86400)
  const hours = Math.floor((diffSec % 86400) / 3600)
  const minutes = Math.floor((diffSec % 3600) / 60)
  const seconds = diffSec % 60

  return {
    stateMode,
    targetSession,
    activeSession: null,
    followingSession: upcomingSessions[1] || null,
    totalSeconds: diffSec,
    days,
    hours,
    minutes,
    seconds,
    isExpired: diffSec === 0,
    isLive: false,
    statusHeading: `NEXT: ${targetSession.title.toUpperCase()}`,
  }
}

export function formatSessionTime(iso: string, format: '12h' | '24h' = '24h'): string {
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

export function formatSessionWeekday(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
  } catch {
    return '—'
  }
}

/**
 * Hook providing a live ticking clock synchronized with an initial ISO string.
 * Second-level changes mutate only subscribers of this hook.
 */
export function useLiveClock(clockIso: string, enableLiveTick = true) {
  const [elapsedSec, setElapsedSec] = useState(0)
  const [prevClockIso, setPrevClockIso] = useState(clockIso)

  if (prevClockIso !== clockIso) {
    setPrevClockIso(clockIso)
    setElapsedSec(0)
  }

  useEffect(() => {
    if (!enableLiveTick) return
    const interval = setInterval(() => {
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [clockIso, enableLiveTick])

  const baseMs = new Date(clockIso).getTime()
  return new Date(baseMs + elapsedSec * 1000).toISOString()
}
