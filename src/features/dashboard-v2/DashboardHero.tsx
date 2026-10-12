import React, { useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { flushSync } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useSchedule,
  useCircuitPreviousEdition,
  useLastRaceResult,
} from '@/api/useF1Data'
import { CIRCUITS, getCircuitInfo } from '@/lib/circuits'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { CountryFlag } from '@/lib/flags'
import { StartLightsTimer } from './StartLightsTimer'
import { PrimaryButton, QuietError, EmptyNote, orDash } from './primitives'
import { motion } from 'motion/react'
import { CircuitOutline } from '@/features/hero/CircuitOutline'
import { useNow } from '@/hooks/useNow'

export const DashboardHero: React.FC<{ id?: string; timerVariant?: string }> = ({ id }) => {
  const { data: schedule, isLoading, isError, refetch } = useSchedule()
  const { data: lastRaceResult } = useLastRaceResult()
  const tz = useTimezone()
  const liveNow = useNow(10000)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const roundOverride = searchParams.get('round')
  const nowOverride = searchParams.get('now')
  const testCompletedOverride = searchParams.get('testCompleted')

  const now = nowOverride ? new Date(nowOverride) : liveNow

  const lastCompletedRound = lastRaceResult?.round ? Number(lastRaceResult.round) : undefined
  const defaultNextRace = schedule?.races
    ? SessionService.findNextRace(schedule.races, now, lastCompletedRound)
    : null
  const nextRaceCandidate =
    roundOverride && schedule?.races
      ? schedule.races.find((r) => String(r.round) === roundOverride) || defaultNextRace
      : defaultNextRace
  const circuitId = nextRaceCandidate?.Circuit?.circuitId
  const { data: prevEdition } = useCircuitPreviousEdition(circuitId, nextRaceCandidate?.season)
  const circuitInfo = getCircuitInfo(circuitId, nextRaceCandidate?.Circuit?.circuitName)
  const trackLength =
    circuitInfo?.lengthKm ||
    (circuitId && CIRCUITS[circuitId]?.lengthKm ? CIRCUITS[circuitId].lengthKm : null)

  const handleExpire = useCallback(() => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['f1'] })
  }, [refetch, queryClient])

  if (isLoading) {
    return (
      <section
        id={id}
        className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[440px] flex items-center justify-center py-20"
      >
        <div className="skeleton-shimmer h-12 w-48 rounded-[4px]" />
      </section>
    )
  }

  if (isError || !schedule) {
    return (
      <section id={id} className="w-full bg-[var(--bg)] px-5 py-24 text-center">
        <QuietError message="Could not load the race schedule." onRetry={refetch} />
      </section>
    )
  }

  const nextRace = nextRaceCandidate

  if (!nextRace) {
    return (
      <section id={id} className="w-full bg-[var(--bg)] px-5 py-24 text-center text-[var(--text)]">
        <EmptyNote>Season has concluded.</EmptyNote>
      </section>
    )
  }

  let weekendSessions = SessionService.extractWeekendSessions(nextRace, now)
  if (testCompletedOverride) {
    const count = parseInt(testCompletedOverride, 10)
    if (!isNaN(count) && count >= 0) {
      weekendSessions = weekendSessions.map((session, idx) => ({
        ...session,
        isFinished: idx < count,
        isLive: false,
      }))
    }
  }

  // Custom dates format with cross-month support
  let dates = null
  if (weekendSessions.length > 0) {
    const start = new Date(weekendSessions[0].startTimeIso)
    const end = new Date(weekendSessions[weekendSessions.length - 1].startTimeIso)
    const startDay = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz.timezone,
      day: 'numeric',
    }).format(start)
    const endDay = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz.timezone,
      day: 'numeric',
    }).format(end)
    const startMonth = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz.timezone,
      month: 'short',
    }).format(start)
    const endMonth = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz.timezone,
      month: 'short',
    }).format(end)
    dates =
      startMonth === endMonth
        ? `${startDay}-${endDay} ${endMonth}`
        : `${startDay} ${startMonth} - ${endDay} ${endMonth}`
  } else if (nextRace.date) {
    dates = tz.formatWeekendSpan(nextRace.date)
  }

  // Find the race session
  const raceSession =
    weekendSessions.find((s) => s.type === 'RACE') ||
    weekendSessions[weekendSessions.length - 1]
  const raceTarget = raceSession?.startTimeIso || null

  // Compute calendar days to the race
  let daysUntil = 0
  let daysLabel = ''

  if (raceTarget) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const targetString = formatter.format(new Date(raceTarget))
    const nowString = formatter.format(now)

    const targetMidnight = new Date(`${targetString}T00:00:00Z`).getTime()
    const nowMidnight = new Date(`${nowString}T00:00:00Z`).getTime()

    daysUntil = Math.max(0, Math.round((targetMidnight - nowMidnight) / (1000 * 60 * 60 * 24)))
  }

  if (daysUntil === 0) {
    daysLabel = 'Race day'
  } else if (daysUntil === 1) {
    daysLabel = '1 day to go'
  } else {
    daysLabel = `${daysUntil} days to go`
  }

  const words = nextRace.raceName.split(' ')
  const weekendPath = `/test/raceweekend/${nextRace.round}`
  const handleWeekendNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return

    event.preventDefault()
    const navigateNow = () => flushSync(() => navigate(weekendPath))
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(navigateNow)
    } else {
      navigateNow()
    }
  }

  return (
    <section
      id={id}
      className="relative w-full bg-[var(--bg)] text-[var(--text)] border-b border-[var(--border-subtle)] pt-9 sm:pt-12 md:pt-14 lg:pt-16 pb-4 sm:pb-5 md:pb-5 lg:pb-6 overflow-hidden scroll-mt-[128px]"
    >
      {/* Background 3D Circuit Outline */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none w-full md:w-[68%] lg:w-[62%] h-full flex items-center justify-start pl-0 sm:pl-2 md:pl-4 pt-6 sm:pt-8 md:pt-10 lg:pt-12 overflow-hidden"
      >
        <CircuitOutline
          circuitId={nextRace.Circuit?.circuitId}
          circuitName={nextRace.Circuit?.circuitName}
          variant="hero-3d"
          align="left"
          rotation={5}
          rotateX={58}
          hideSectorLegend={true}
          className="w-[94%] h-[94%] sm:w-[89%] sm:h-[89%] md:w-[85%] md:h-[85%] text-[var(--text)] object-contain"
        />
      </div>

      <div className="relative z-10 max-w-[1560px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-4 sm:gap-y-5 lg:gap-y-5 lg:gap-x-8 items-start mb-0 sm:mb-1 lg:mb-1">
          {/* Main Info */}
          <div className="order-1 lg:col-span-7 xl:col-span-7 flex flex-col">
            {/* Fact Strip */}
            <motion.div
              className="flex items-center gap-4 mb-3 sm:mb-4 md:mb-4 text-[12px] font-semibold tracking-wider uppercase text-[var(--text-muted)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <span>
                  Round {nextRace.round} / {schedule.races.length}
                </span>
                <span className="text-[var(--border-subtle)] opacity-40">•</span>
                <span>{daysLabel}</span>
              </div>
            </motion.div>

            {/* Title */}
            <h1
              className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.02em] text-[clamp(42px,5vw,76px)] leading-[0.94] mt-1.5 sm:mt-2.5 lg:mt-3"
              style={{ viewTransitionName: 'raceweekend-title' }}
            >
              {words.map((word, i) => (
                <React.Fragment key={i}>
                  <span className="inline-block overflow-hidden mr-[0.25em] last:mr-0">
                    <motion.span
                      className="inline-block"
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.65,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.1 + i * 0.1,
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                  {i < words.length - 1 ? ' ' : null}
                </React.Fragment>
              ))}
            </h1>
          </div>

          {/* Right Column: Start Lights Timer */}
          <div className="order-3 lg:order-2 lg:col-span-5 xl:col-span-5 flex flex-col w-full">
            <StartLightsTimer
              sessions={weekendSessions}
              now={now}
              timezoneLabel={tz.timezoneAbbr}
              timeFormat={tz.is24h ? '24h' : '12h'}
              onExpire={handleExpire}
            />
          </div>

          {/* Track Data: Same Format with White Underline in Dark Mode, Complete Left in 2 Lines */}
          <div className="order-2 lg:order-3 lg:col-span-7 xl:col-span-7 flex flex-col mt-5 sm:mt-7 md:mt-9 lg:mt-11 pt-4 sm:pt-5 md:pt-6 lg:pt-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-7 sm:gap-x-10 lg:gap-x-12 gap-y-2 sm:gap-y-2.5 max-w-4xl">
              {/* Fact 1: Circuit */}
              <div className="flex flex-col pb-1 sm:pb-1.5 border-b border-[var(--border)] dark:border-white">
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">
                  Circuit
                </span>
                <div className="text-[var(--text)] font-semibold text-[15px] md:text-[16px] leading-tight">
                  {nextRace.Circuit?.circuitName}
                </div>
              </div>

              {/* Fact 2: Location */}
              <div className="flex flex-col pb-1 sm:pb-1.5 border-b border-[var(--border)] dark:border-white">
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">
                  Location
                </span>
                <div className="text-[var(--text)] font-semibold text-[15px] md:text-[16px] leading-tight flex items-center gap-2">
                  {nextRace.Circuit?.Location?.country ? (
                    <CountryFlag
                      country={nextRace.Circuit.Location.country}
                      className="w-5 h-5 rounded-[2px] shrink-0"
                    />
                  ) : null}
                  <span>{nextRace.Circuit?.Location?.locality}</span>
                </div>
              </div>

              {/* Fact 3: Dates */}
              <div className="flex flex-col pb-1 sm:pb-1.5 border-b border-[var(--border)] dark:border-white">
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">
                  Dates
                </span>
                <div className="text-[var(--text)] font-semibold text-[15px] md:text-[16px] leading-tight dv2-fig">
                  {orDash(dates)}
                </div>
              </div>

              {/* Fact 4: Total Laps */}
              <div className="flex flex-col pb-1 sm:pb-1.5 border-b border-[var(--border)] dark:border-white">
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">
                  Total Laps
                </span>
                <div className="text-[var(--text)] font-semibold text-[15px] md:text-[16px] leading-tight dv2-fig">
                  {prevEdition?.laps || '—'}
                </div>
              </div>

              {/* Fact 5: Last Winner */}
              <div className="flex flex-col pb-1 sm:pb-1.5 border-b border-[var(--border)] dark:border-white">
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">
                  Last Winner
                </span>
                <div className="text-[var(--text)] font-semibold text-[15px] md:text-[16px] leading-tight">
                  {prevEdition?.winnerName ? (
                    <span className="flex items-baseline gap-1.5 flex-wrap">
                      <span>{prevEdition.winnerName}</span>
                      <span className="text-[12px] font-normal text-[var(--text-muted)] dv2-fig">
                        {prevEdition.season}
                      </span>
                    </span>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              {/* Fact 6: Track Length */}
              <div className="flex flex-col pb-1 sm:pb-1.5 border-b border-[var(--border)] dark:border-white">
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">
                  Track Length
                </span>
                <div className="text-[var(--text)] font-semibold text-[15px] md:text-[16px] leading-tight dv2-fig">
                  {trackLength || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA: View race weekend */}
          <div className="order-4 lg:order-4 lg:col-span-5 xl:col-span-5 flex items-center justify-start lg:justify-end lg:self-end pb-0.5 pt-6 sm:pt-8 lg:pt-0">
            <motion.div
              className="shrink-0 flex items-center lg:items-end"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Link to={weekendPath} viewTransition onClick={handleWeekendNavigation}>
                <PrimaryButton>View race weekend</PrimaryButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardHero
