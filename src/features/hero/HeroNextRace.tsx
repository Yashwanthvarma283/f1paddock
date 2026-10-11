import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { F1Race, LiveSessionStatus, DriverStandingItem, LastRaceResultPayload } from '@/api/types'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { CountdownTicker } from './CountdownTicker'
import { CircuitOutline } from './CircuitOutline'
import { SessionSchedule } from './SessionSchedule'
import { LiveStatusBadge } from './LiveStatusBadge'
import { WeekendIntel } from './WeekendIntel'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { CountryFlag } from '@/lib/flags'
import { Calendar, ChevronRight, MapPin, Flag } from 'lucide-react'

interface HeroNextRaceProps {
  race: F1Race | null
  liveStatus: LiveSessionStatus
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  drivers?: DriverStandingItem[]
  lastResult?: LastRaceResultPayload | null
}

export const HeroNextRace: React.FC<HeroNextRaceProps> = ({
  race,
  liveStatus,
  isLoading,
  error,
  onRetry,
  drivers = [],
  lastResult = null,
}) => {
  const { formatFullRaceDate, formatWeekendSpan } = useTimezone()

  // Extract weekend sessions and find the next session
  const { sessions, nextSession } = useMemo(() => {
    if (!race) return { sessions: [], nextSession: null }
    const s = SessionService.extractWeekendSessions(race)
    const next = SessionService.getNextUpcomingSession(s)
    return { sessions: s, nextSession: next }
  }, [race])

  // Loading skeleton matching final geometry
  if (isLoading) {
    return (
      <section className="py-8 sm:py-12 border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-16 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <div className="flex gap-4">
                  <Skeleton className="h-11 w-44 rounded-md" />
                  <Skeleton className="h-11 w-36 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 mt-auto flex-1">
                <Skeleton className="h-full min-h-[148px] rounded-xl" />
                <Skeleton className="h-full min-h-[148px] rounded-xl" />
                <Skeleton className="h-full min-h-[148px] rounded-xl" />
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-52 w-full rounded-xl flex-1" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (error || !race) {
    return (
      <section className="py-12 border-b border-[var(--border)] text-center bg-[var(--surface-1)]">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-glow-subtle)] border border-[var(--accent)] flex items-center justify-center mx-auto text-[var(--accent)]">
            <Flag className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display uppercase tracking-tight text-[var(--text)]">
            Upcoming Race Telemetry Unavailable
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Unable to connect to telemetry API. Please check your network connection.
          </p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry Connection
            </Button>
          )}
        </div>
      </section>
    )
  }

  const raceId = `${race.season}-${race.round}`

  return (
    <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-20 border-b border-[var(--border)] bg-[var(--surface-1)]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Live or Replay banner if active */}
        <div className="mb-4">
          <LiveStatusBadge status={liveStatus} raceId={raceId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Heading, Circuit metadata, Live Countdown, CTA, Weekend Intel */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-6">
              {/* Round Tag with Angled F1 Skew Cut */}
              <div className="flex items-center gap-3">
                <div className="f1-slash-tag px-3 py-1 bg-[var(--accent-glow-subtle)] border border-[var(--accent)] text-[var(--accent-text)] text-xs font-mono font-black uppercase tracking-wider shadow-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    ROUND {String(race.round).padStart(2, '0')} &bull; {race.season}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
                  <CountryFlag country={race.Circuit.Location.country} className="w-4 h-3 rounded-xs shadow-xs" />
                  <span className="text-[var(--text)] font-semibold">{race.Circuit.Location.country}</span>
                </div>
              </div>

              {/* Race Name with Line Mask Reveal & Balanced Clamp (No orphaned "PRIX") */}
              <div className="space-y-2">
                <div className="overflow-hidden py-0.5">
                  <h1
                    className="f1-title-reveal font-display font-black text-3xl sm:text-5xl lg:text-[clamp(2.2rem,3.8vw,3.75rem)] uppercase tracking-tight text-[var(--text)] leading-[0.95] [text-wrap:balance]"
                    style={{ textWrap: 'balance' }}
                  >
                    {race.raceName.replace('GRAND PRIX', 'GRAND\u00A0PRIX')}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5 text-[var(--text)] font-medium">
                    <MapPin className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    {race.Circuit.circuitName}, {race.Circuit.Location.locality}
                  </span>
                  <span className="hidden sm:inline text-[var(--border)]">&bull;</span>
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono">
                    <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span className="font-bold text-[var(--text)]">{formatWeekendSpan(race.date)}</span>
                    <span className="text-[var(--border)]">&bull;</span>
                    <span className="font-semibold text-[var(--text-muted)]">{formatFullRaceDate(race.date)}</span>
                  </span>
                </div>
              </div>

              {/* Next Session Live Countdown Ticker with Top Edge Accent */}
              <div className="f1-card-accent p-4 sm:p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-[var(--card-shadow)]">
                <CountdownTicker targetSession={nextSession} raceName={race.raceName} />
              </div>

              {/* Primary & Secondary CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to={`/race/${raceId}`}>
                  <Button size="lg" variant="primary" icon={<ChevronRight className="w-4 h-4" />}>
                    Open race weekend
                  </Button>
                </Link>
                <Link to="/calendar">
                  <Button size="lg" variant="secondary">
                    View Full Calendar
                  </Button>
                </Link>
              </div>
            </div>

            {/* Weekend Intel Row: Weather, Championship Top 3, Last GP Podium (flexes to fill height) */}
            <div className="pt-2 mt-auto flex-1 flex flex-col justify-end">
              <WeekendIntel
                locality={race.Circuit.Location.locality}
                circuitName={race.Circuit.circuitName}
                drivers={drivers}
                lastResult={lastResult}
                isLoading={isLoading}
                error={error}
                onRetry={onRetry}
              />
            </div>
          </div>

          {/* Right Column: Track Map & Timetable */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
            {/* SVG Track Outline with Animated Drawing, Sectors, Corners & Tooltips */}
            <CircuitOutline
              circuitId={race.Circuit.circuitId}
              circuitName={race.Circuit.circuitName}
            />

            {/* Weekend Session Timetable */}
            <div className="f1-card-accent p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--card-shadow)] flex-1 flex flex-col justify-between">
              <SessionSchedule sessions={sessions} activeSessionId={nextSession?.id} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
