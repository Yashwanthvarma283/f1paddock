import React, { useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { flushSync } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSchedule, useCircuitPreviousEdition, useLastRaceResult, useLiveStatus } from '@/api/useF1Data'
import { CIRCUITS, getCircuitInfo } from '@/lib/circuits'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { CountryFlag } from '@/lib/flags'
import { Countdown } from './Countdown'
import { PrimaryButton, Fact, QuietError, EmptyNote, orDash } from './primitives'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { CircuitOutline } from '@/features/hero/CircuitOutline'
import { useNow } from '@/hooks/useNow'

export const DashboardHero: React.FC<{ id?: string }> = ({ id }) => {
  const { data: schedule, isLoading, isError, refetch } = useSchedule()
  const { data: lastRaceResult } = useLastRaceResult()
  const tz = useTimezone()
  const now = useNow(10000)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const roundOverride = searchParams.get('round')

  const lastCompletedRound = lastRaceResult?.round ? Number(lastRaceResult.round) : undefined
  const defaultNextRace = schedule?.races
    ? SessionService.findNextRace(schedule.races, now, lastCompletedRound)
    : null
  const nextRaceCandidate = (roundOverride && schedule?.races)
    ? (schedule.races.find((r) => String(r.round) === roundOverride) || defaultNextRace)
    : defaultNextRace
  const circuitId = nextRaceCandidate?.Circuit?.circuitId
  const { data: prevEdition } = useCircuitPreviousEdition(circuitId, nextRaceCandidate?.season)
  const circuitInfo = getCircuitInfo(circuitId, nextRaceCandidate?.Circuit?.circuitName)
  const trackLength = circuitInfo?.lengthKm || (circuitId && CIRCUITS[circuitId]?.lengthKm ? CIRCUITS[circuitId].lengthKm : null)
  
  const { data: liveStatus } = useLiveStatus(
    nextRaceCandidate?.Circuit?.circuitName,
    nextRaceCandidate?.Circuit?.Location?.country
  )

  const handleExpire = useCallback(() => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['f1'] })
  }, [refetch, queryClient])
  
  if (isLoading) {
    return (
      <section id={id} className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[400px] flex items-center justify-center">
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
  
  const weekendSessions = SessionService.extractWeekendSessions(nextRace, now)
  const nextSession = SessionService.getNextUpcomingSession(weekendSessions, now)
  const countdownTarget = nextSession?.startTimeIso || null
  const isSessionLive = Boolean(nextSession?.isLive || liveStatus?.isLive)
  
  // Custom dates format using weekendSessions to avoid the -48hr bug
  let dates = null
  if (weekendSessions.length > 0) {
    const start = new Date(weekendSessions[0].startTimeIso)
    const end = new Date(weekendSessions[weekendSessions.length - 1].startTimeIso)
    const startDay = new Intl.DateTimeFormat('en-GB', { timeZone: tz.timezone, day: 'numeric' }).format(start)
    const endDay = new Intl.DateTimeFormat('en-GB', { timeZone: tz.timezone, day: 'numeric' }).format(end)
    const month = new Intl.DateTimeFormat('en-GB', { timeZone: tz.timezone, month: 'short' }).format(end)
    dates = `${startDay}-${endDay} ${month}`
  }

  // Find the race session
  const raceSession = weekendSessions.find(s => s.type === 'RACE') || weekendSessions[weekendSessions.length - 1]
  const raceTarget = raceSession?.startTimeIso || null

  // Compute calendar days to the race
  let daysUntil = 0
  let daysLabel = ''
  
  if (raceTarget) {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz.timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
    const targetString = formatter.format(new Date(raceTarget))
    const nowString = formatter.format(now)
    
    const targetMidnight = new Date(`${targetString}T00:00:00Z`).getTime()
    const nowMidnight = new Date(`${nowString}T00:00:00Z`).getTime()
    
    daysUntil = Math.max(0, Math.round((targetMidnight - nowMidnight) / (1000 * 60 * 60 * 24)))
  }
  
  if (daysUntil === 0) {
    daysLabel = "Race day"
  } else if (daysUntil === 1) {
    daysLabel = "1 day to go"
  } else {
    daysLabel = `${daysUntil} days to go`
  }

  const words = nextRace.raceName.split(' ')
  const weekendPath = `/test/raceweekend/${nextRace.round}`
  const handleWeekendNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    const navigateNow = () => flushSync(() => navigate(weekendPath))
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(navigateNow)
    } else {
      navigateNow()
    }
  }

  return (
    <section id={id} className="relative w-full bg-[var(--bg)] text-[var(--text)] border-b border-[var(--border-subtle)] pt-14 md:pt-18 lg:pt-20 pb-10 md:pb-12 lg:pb-14 overflow-hidden scroll-mt-[128px]">
      {/* Background Circuit Outline */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full flex items-center justify-center md:pr-[10%] lg:pr-[14%] pb-12 md:pb-20">
        <CircuitOutline circuitId={nextRace.Circuit?.circuitId} circuitName={nextRace.Circuit?.circuitName} variant="hero-3d" className="w-[85%] h-[85%] md:w-[60%] md:h-[60%] text-[var(--text)] object-contain" />
      </div>

      <div className="relative z-10 max-w-[1560px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* Main Info */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            
            {/* Fact Strip */}
            <motion.div 
              className="flex items-center gap-4 mb-6 md:mb-7 text-[12px] font-semibold tracking-wider uppercase text-[var(--text-muted)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <span>Round {nextRace.round} / {schedule.races.length}</span>
                <span className="hidden sm:inline text-[var(--border-subtle)] opacity-30">•</span>
                <span>{daysLabel}</span>
              </div>
            </motion.div>

            <h1
              className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.02em] text-[clamp(42px,5vw,76px)] leading-[0.92] mb-6 md:mb-7"
              style={{ viewTransitionName: 'raceweekend-title' }}
            >
              {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.22em] last:mr-0">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.1 }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-0 max-w-3xl mb-6 md:mb-8">
              <Fact index={1} label="Circuit" value={nextRace.Circuit?.circuitName} />
              <Fact index={2} label="Location" value={
                <span className="flex items-center gap-2">
                  {nextRace.Circuit?.Location?.country ? <CountryFlag country={nextRace.Circuit.Location.country} className="w-5 h-5 rounded-[2px]" /> : null}
                  {nextRace.Circuit?.Location?.locality}
                </span>
              } />
              <Fact index={3} label="Dates" value={orDash(dates)} mono />
              <Fact index={4} label="Total Laps" value={prevEdition?.laps || '—'} mono />
              <Fact index={5} label="Last Winner" value={
                prevEdition?.winnerName ? (
                  <span className="flex items-baseline gap-1.5 flex-wrap">
                    <span>{prevEdition.winnerName}</span>
                    <span className="text-[13px] font-normal text-[var(--text-muted)] dv2-fig">{prevEdition.season}</span>
                  </span>
                ) : '—'
              } />
              <Fact index={6} label="Track Length" value={trackLength || '—'} mono />
            </div>

            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Link to={weekendPath} viewTransition onClick={handleWeekendNavigation}>
                <PrimaryButton>View race weekend</PrimaryButton>
              </Link>
            </motion.div>
          </div>
          
          {/* Stat Strip & Countdown */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-[var(--surface-1)] border border-[var(--border)] rounded-[4px] p-6 lg:p-8 backdrop-blur-md self-start">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Countdown 
                targetIso={countdownTarget} 
                label={isSessionLive ? `Live: ${nextSession?.title || 'Race'}` : `Next: ${nextSession?.title || 'Race'}`} 
                isLive={isSessionLive}
                onExpire={handleExpire}
              />
            </motion.div>
            
            <motion.div 
              className="border-t border-[var(--border)] pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-2">
                Weekend Schedule ({tz.timezoneAbbr})
              </div>
              <ul className="flex flex-col">
                {weekendSessions.map((session) => {
                  const isPast = session.isFinished
                  const isActive = session.isLive || (isSessionLive && session.id === nextSession?.id)
                  return (
                    <li key={session.id} className={cn(
                      'h-[40px] flex items-center justify-between border-b border-[var(--border)] last:border-b-0',
                      isPast && 'opacity-50'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full transition-colors',
                          isActive ? 'bg-[var(--accent)] animate-pulse' : (isPast ? 'bg-transparent' : 'bg-[var(--text-muted)]')
                        )} />
                        <span className="text-[14px] font-medium">{session.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] text-[var(--text-muted)] uppercase tracking-wider">{tz.formatWeekday(session.startTimeIso)}</span>
                        {/* Fixed width to 8ch and nowrap for 12h time wrap fix */}
                        <span className="dv2-fig text-[15px] font-semibold w-[8ch] whitespace-nowrap text-right">{tz.formatTime(session.startTimeIso)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
