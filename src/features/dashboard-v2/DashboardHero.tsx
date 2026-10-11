import React from 'react'
import { Link } from 'react-router-dom'
import { useSchedule } from '@/api/useF1Data'
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
  const tz = useTimezone()
  const now = useNow()
  
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
  
  const nextRace = SessionService.findNextRace(schedule.races)
  
  if (!nextRace) {
    return (
      <section id={id} className="w-full bg-[var(--bg)] px-5 py-24 text-center text-[var(--text)]">
        <EmptyNote>Season has concluded.</EmptyNote>
      </section>
    )
  }
  
  const weekendSessions = SessionService.extractWeekendSessions(nextRace)
  const nextSession = SessionService.getNextUpcomingSession(weekendSessions)
  const countdownTarget = nextSession?.startTimeIso || null
  
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

  return (
    <section id={id} className="relative w-full bg-[var(--bg)] text-[var(--text)] border-b border-[var(--border-subtle)] pt-[43px] md:pt-[51px] lg:pt-[75px] pb-12 md:pb-16 lg:pb-24 overflow-hidden">
      {/* Background Circuit Outline */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full flex items-center justify-center md:pr-[10%] lg:pr-[14%] pb-12 md:pb-20">
        <CircuitOutline circuitId={nextRace.Circuit?.circuitId} variant="hero-3d" className="w-[85%] h-[85%] md:w-[60%] md:h-[60%] text-[var(--text)] object-contain" />
      </div>

      <div className="relative z-10 max-w-[1560px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            
            {/* Fact Strip */}
            <motion.div 
              className="flex flex-wrap gap-6 mb-8 text-[12px] font-semibold tracking-wider uppercase text-[var(--text-muted)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <span>Round {nextRace.round} / {schedule.races.length}</span>
              <span className="hidden sm:inline text-[var(--border-subtle)] opacity-30">•</span>
              <span>{daysLabel}</span>
            </motion.div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.02em] text-[48px] md:text-[72px] lg:text-[88px] leading-[0.9] mb-8">
              {words.map((word, i) => (
                <div key={i} className="overflow-hidden">
                  <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.1 }}
                  >
                    {word}
                  </motion.div>
                </div>
              ))}
            </h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-0 max-w-3xl mb-12">
              <Fact index={1} label="Circuit" value={nextRace.Circuit?.circuitName} />
              <Fact index={2} label="Location" value={
                <span className="flex items-center gap-2">
                  {nextRace.Circuit?.Location?.country ? <CountryFlag country={nextRace.Circuit.Location.country} className="w-5 h-5 rounded-[2px]" /> : null}
                  {nextRace.Circuit?.Location?.locality}
                </span>
              } />
              <Fact index={3} label="Dates" value={orDash(dates)} mono />
            </div>

            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Link to={`/test/raceweekend/${nextRace.round}`} viewTransition>
                <PrimaryButton>View race weekend</PrimaryButton>
              </Link>
            </motion.div>
          </div>
          
          {/* Stat Strip & Countdown */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-[var(--surface-1)] border border-[var(--border)] rounded-[4px] p-6 lg:p-8 backdrop-blur-md">
            <motion.div 
              className="mb-10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Countdown targetIso={countdownTarget} label={`Next: ${nextSession?.title || 'Race'}`} />
            </motion.div>
            
            <motion.div 
              className="border-t border-[var(--border)] pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-4">
                Weekend Schedule ({tz.timezoneAbbr})
              </div>
              <ul className="flex flex-col">
                {weekendSessions.map((session) => {
                  const isPast = session.isFinished
                  const isActive = session.isLive
                  return (
                    <li key={session.id} className={cn(
                      'flex items-center justify-between py-3 border-b border-[var(--border)]/50 last:border-b-0',
                      isPast && 'opacity-50'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-[var(--accent)]' : (isPast ? 'bg-transparent' : 'bg-[var(--text-muted)]'))} />
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
