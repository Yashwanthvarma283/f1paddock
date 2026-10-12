import type { WeekendSession } from '@/api/types'

export interface TimerVariantProps {
  countdownTarget: string | null
  nextSession: WeekendSession | null
  isSessionLive: boolean
  weekendSessions: WeekendSession[]
  timezoneAbbr: string
  formatWeekday: (iso: string) => string
  formatTime: (iso: string) => string
  onExpire?: () => void
}
