import type {
  ConstructorStandingItem,
  DriverStandingItem,
  F1Race,
  F1ResultItem,
  WeekendSession,
} from '@/api/types'
import type { CircuitInfo } from '@/lib/circuits'

export type WeekendState = 'upcoming' | 'in-progress' | 'completed'

export type SessionState = 'upcoming' | 'running' | 'completed' | 'unknown'

export interface RaceWeekendModel {
  race: F1Race
  year: string
  sessions: WeekendSession[]
  circuit: CircuitInfo | null
  weekendState: WeekendState
  selectedTimezone: string
  is24h: boolean
  drivers: DriverStandingItem[]
  constructors: ConstructorStandingItem[]
  result: {
    season: string
    round: string
    raceName: string
    results: F1ResultItem[]
    fastestLap?: F1ResultItem
  } | null
}
