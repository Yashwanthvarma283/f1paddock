import type { WeekendSession } from '@/api/types'
import type { TimerStateMode } from './types'

// Canonical weekend sessions for testing (Austin / COTA weekend)
export const FIXTURE_SESSIONS: WeekendSession[] = [
  {
    id: 'fp1',
    type: 'FP1',
    title: 'Practice 1',
    startTimeIso: '2026-10-16T17:30:00Z', // Friday 12:30 CDT / 17:30 UTC
    endTimeIso: '2026-10-16T18:30:00Z',
    isFinished: false,
    isLive: false,
    isUpcoming: true,
  },
  {
    id: 'fp2',
    type: 'FP2',
    title: 'Practice 2',
    startTimeIso: '2026-10-16T21:00:00Z', // Friday 16:00 CDT / 21:00 UTC
    endTimeIso: '2026-10-16T22:00:00Z',
    isFinished: false,
    isLive: false,
    isUpcoming: true,
  },
  {
    id: 'fp3',
    type: 'FP3',
    title: 'Practice 3',
    startTimeIso: '2026-10-17T17:30:00Z', // Saturday 12:30 CDT / 17:30 UTC
    endTimeIso: '2026-10-17T18:30:00Z',
    isFinished: false,
    isLive: false,
    isUpcoming: true,
  },
  {
    id: 'qualifying',
    type: 'QUAL',
    title: 'Qualifying',
    startTimeIso: '2026-10-17T21:00:00Z', // Saturday 16:00 CDT / 21:00 UTC
    endTimeIso: '2026-10-17T22:00:00Z',
    isFinished: false,
    isLive: false,
    isUpcoming: true,
  },
  {
    id: 'race',
    type: 'RACE',
    title: 'Race',
    startTimeIso: '2026-10-18T19:00:00Z', // Sunday 14:00 CDT / 19:00 UTC
    endTimeIso: '2026-10-18T21:00:00Z',
    isFinished: false,
    isLive: false,
    isUpcoming: true,
  },
]

export interface FixtureScenario {
  mode: TimerStateMode
  label: string
  clockIso: string
  sessions: WeekendSession[]
}

export const FIXTURE_SCENARIOS: Record<TimerStateMode, FixtureScenario> = {
  gt24h: {
    mode: 'gt24h',
    label: 'State 1: > 24 Hours',
    // 2 days 14 hours 38 mins 49 secs before FP1 (2026-10-14T02:51:11Z)
    clockIso: '2026-10-14T02:51:11Z',
    sessions: FIXTURE_SESSIONS.map((s) => ({ ...s, isFinished: false, isLive: false })),
  },
  lt24h: {
    mode: 'lt24h',
    label: 'State 2: < 24 Hours',
    // 18 hours 45 mins 12 secs before FP1 (2026-10-15T22:44:48Z)
    clockIso: '2026-10-15T22:44:48Z',
    sessions: FIXTURE_SESSIONS.map((s) => ({ ...s, isFinished: false, isLive: false })),
  },
  lt1h: {
    mode: 'lt1h',
    label: 'State 3: < 1 Hour',
    // 42 mins 18 secs before Qualifying (2026-10-17T20:17:42Z)
    clockIso: '2026-10-17T20:17:42Z',
    sessions: FIXTURE_SESSIONS.map((s) => ({
      ...s,
      isFinished: ['fp1', 'fp2', 'fp3'].includes(s.id),
      isLive: false,
    })),
  },
  lt1m: {
    mode: 'lt1m',
    label: 'State 4: < 1 Minute',
    // 48 secs before Race (2026-10-18T18:59:12Z)
    clockIso: '2026-10-18T18:59:12Z',
    sessions: FIXTURE_SESSIONS.map((s) => ({
      ...s,
      isFinished: s.id !== 'race',
      isLive: false,
    })),
  },
  running: {
    mode: 'running',
    label: 'State 5: Running Now',
    // During FP2 (2026-10-16T21:25:00Z: 25 mins into FP2)
    clockIso: '2026-10-16T21:25:00Z',
    sessions: FIXTURE_SESSIONS.map((s) => ({
      ...s,
      isFinished: s.id === 'fp1',
      isLive: s.id === 'fp2',
    })),
  },
  completed: {
    mode: 'completed',
    label: 'State 6: Weekend Complete',
    // Sunday night after Race
    clockIso: '2026-10-18T22:30:00Z',
    sessions: FIXTURE_SESSIONS.map((s) => ({
      ...s,
      isFinished: true,
      isLive: false,
    })),
  },
}
