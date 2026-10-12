import type { WeekendSession } from '@/api/types'

export type TimerVariant = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export type TimerStateMode =
  | 'gt24h'       // State 1: > 24 hours to next session
  | 'lt24h'       // State 2: < 24 hours to next session
  | 'lt1h'        // State 3: < 1 hour to next session
  | 'lt1m'        // State 4: < 1 minute to next session
  | 'running'     // State 5: Session running now ("NOW: <session>", "In progress")
  | 'completed'   // State 6: Weekend complete ("Weekend complete")

export interface WeekendTimerProps {
  variant: TimerVariant
  sessions: WeekendSession[]
  clockIso: string
  timezoneLabel: string
  timeFormat?: '12h' | '24h'
  className?: string
}

export interface DerivedTimerState {
  stateMode: TimerStateMode
  targetSession: WeekendSession | null
  activeSession: WeekendSession | null
  followingSession: WeekendSession | null
  totalSeconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  isLive: boolean
  statusHeading: string
}
