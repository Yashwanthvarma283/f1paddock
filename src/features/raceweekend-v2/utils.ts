import type { F1Race, WeekendSession } from '@/api/types'
import { CIRCUITS } from '@/lib/circuits'
import { SessionService } from '@/api/sessionService'
import { formatTimeInZone } from '@/lib/timezone'
import type { SessionState, WeekendState } from './types'

export const RACEWEEKEND_SECTIONS = [
  { id: 'weekend', label: 'Weekend' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'circuit', label: 'Circuit' },
  { id: 'championship', label: 'Championship' },
  { id: 'results', label: 'Results' },
] as const

export function toDate(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getWeekendState(sessions: WeekendSession[], now = new Date()): WeekendState {
  if (sessions.some((session) => getSessionState(session, now) === 'running')) return 'in-progress'
  if (sessions.length > 0 && sessions.every((session) => getSessionState(session, now) === 'completed')) return 'completed'
  return 'upcoming'
}

export function getSessionState(session: WeekendSession, now = new Date()): SessionState {
  const nowMs = now.getTime()
  const startMs = new Date(session.startTimeIso).getTime()
  const endMs = new Date(session.endTimeIso).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 'unknown'

  if (nowMs >= startMs && nowMs < endMs) return 'running'
  if (nowMs >= endMs) return 'completed'
  return 'upcoming'
}

export function getNextSession(sessions: WeekendSession[], now = new Date()): WeekendSession | null {
  return (
    sessions.find((session) => getSessionState(session, now) === 'running') ??
    sessions.find((session) => getSessionState(session, now) === 'upcoming') ??
    null
  )
}

export function formatDateInTimezone(value: string, timezone: string): string {
  const date = toDate(value)
  if (!date) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function formatTimeInTimezone(value: string, timezone: string, is24h = true): string {
  const date = toDate(value)
  if (!date) return '—'

  return formatTimeInZone(date, timezone, is24h)
}

export function formatWeekdayInTimezone(value: string, timezone: string): string {
  const date = toDate(value)
  if (!date) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date)
}

export function getDateKey(value: string, timezone: string): string {
  const date = toDate(value)
  if (!date) return 'unknown'

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatWeekendDates(sessions: WeekendSession[], timezone: string): string {
  const first = sessions[0]
  const last = sessions[sessions.length - 1]
  if (!first || !last) return '—'

  const start = formatDateInTimezone(first.startTimeIso, timezone)
  const end = formatDateInTimezone(last.startTimeIso, timezone)
  return start === end ? start : `${start}–${end}`
}

export function resolveCircuit(race: F1Race) {
  // Exact IDs only: the legacy fuzzy resolver can substitute unrelated circuits.
  return CIRCUITS[race.Circuit.circuitId] ?? null
}

export function buildSessions(race: F1Race): WeekendSession[] {
  const fields = { FP1: race.FirstPractice, FP2: race.SecondPractice, FP3: race.ThirdPractice,
    SQ: race.SprintQualifying, SPRINT: race.Sprint, QUAL: race.Qualifying, RACE: race }
  // Avoid the legacy service's noon fallback when the feed omits a start time.
  return SessionService.extractWeekendSessions(race)
    .map(session => fields[session.type]?.time ? session : null)
    .filter((session): session is WeekendSession => Boolean(session))
}

export function formatSessionType(type: WeekendSession['type']): string {
  switch (type) {
    case 'FP1':
      return 'Practice 1'
    case 'FP2':
      return 'Practice 2'
    case 'FP3':
      return 'Practice 3'
    case 'SQ':
      return 'Sprint qualifying'
    case 'SPRINT':
      return 'Sprint'
    case 'QUAL':
      return 'Qualifying'
    case 'RACE':
      return 'Grand Prix'
  }
}

export function formatCountdown(targetIso: string | null, now = new Date()): string {
  if (!targetIso) return '—'
  const target = new Date(targetIso).getTime()
  const difference = target - now.getTime()
  if (!Number.isFinite(difference) || difference <= 0) return '—'

  const totalSeconds = Math.floor(difference / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  return days > 0
    ? `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m`
    : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
}
