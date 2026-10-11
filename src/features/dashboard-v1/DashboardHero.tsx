import React from 'react'
import { Link } from 'react-router-dom'
import { useSchedule } from '@/api/useF1Data'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { CountryFlag } from '@/lib/flags'
import { Countdown } from './Countdown'
import { PrimaryButton, Fact, QuietError, EmptyNote, orDash } from './primitives'
import { cn } from '@/lib/utils'

export const DashboardHero: React.FC<{ id?: string }> = ({ id }) => {
  const { data: schedule, isLoading, isError, refetch } = useSchedule()
  const tz = useTimezone()
  
  if (isLoading) {
    return (
      <section id={id} className="w-full bg-[var(--dv2-hero-bg)] text-[var(--dv2-hero-text)] min-h-[400px] flex items-center justify-center">
        <div className="skeleton-shimmer h-12 w-48 rounded-[4px]" />
      </section>
    )
  }
  
  if (isError || !schedule) {
    return (
      <section id={id} className="w-full bg-[var(--dv2-hero-bg)] px-5 py-24 text-center">
        <QuietError message="Could not load the race schedule." onRetry={refetch} />
      </section>
    )
  }
  
  const nextRace = SessionService.findNextRace(schedule.races)
  
  if (!nextRace) {
    return (
      <section id={id} className="w-full bg-[var(--dv2-hero-bg)] px-5 py-24 text-center text-[var(--dv2-hero-text)]">
        <EmptyNote>Season has concluded.</EmptyNote>
      </section>
    )
  }
  
  const weekendSessions = SessionService.extractWeekendSessions(nextRace)
  const nextSession = SessionService.getNextUpcomingSession(weekendSessions)
  const countdownTarget = nextSession?.startTimeIso || null
  
  const dates = nextRace.date ? tz.formatWeekendSpan(SessionService.parseSessionIso(nextRace.date, nextRace.time) || nextRace.date) : null

  return (
    <section id={id} className="w-full bg-[var(--dv2-hero-bg)] text-[var(--dv2-hero-text)] border-b border-[var(--border-subtle)] pb-14 md:pb-16 pt-14 md:pt-18 lg:pt-24">
      <div className="max-w-[1560px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            <h1 className="dv2-rise font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.02em] text-[40px] md:text-[64px] lg:text-[80px] leading-[0.95] mb-8" style={{ '--dv2-i': 0 } as React.CSSProperties}>
              {nextRace.raceName}
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

            <div className="dv2-rise flex items-center" style={{ '--dv2-i': 4 } as React.CSSProperties}>
              <Link to={`/race/${nextRace.round}`}>
                <PrimaryButton>View race weekend</PrimaryButton>
              </Link>
            </div>
          </div>
          
          {/* Stat Strip & Countdown */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-[var(--dv2-hero-border)]/20 border border-[var(--dv2-hero-border)] rounded-[4px] p-6 lg:p-8">
            <div className="dv2-rise mb-10" style={{ '--dv2-i': 5 } as React.CSSProperties}>
              <Countdown targetIso={countdownTarget} label={`Next: ${nextSession?.title || 'Race'}`} />
            </div>
            
            <div className="dv2-rise border-t border-[var(--dv2-hero-border)] pt-8" style={{ '--dv2-i': 6 } as React.CSSProperties}>
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--dv2-hero-muted)] mb-4">
                Weekend Schedule ({tz.timezoneAbbr})
              </div>
              <ul className="flex flex-col">
                {weekendSessions.map((session, i) => {
                  const isPast = session.isFinished
                  const isActive = session.isLive
                  return (
                    <li key={session.id} className={cn(
                      'flex items-center justify-between py-3 border-b border-[var(--dv2-hero-border)]/50 last:border-b-0',
                      isPast && 'opacity-50'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-[var(--accent)]' : (isPast ? 'bg-transparent' : 'bg-[var(--dv2-hero-muted)]'))} />
                        <span className="text-[14px] font-medium">{session.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] text-[var(--dv2-hero-muted)] uppercase tracking-wider">{tz.formatWeekday(session.startTimeIso)}</span>
                        <span className="dv2-fig text-[15px] font-semibold w-[4ch] text-right">{tz.formatTime(session.startTimeIso)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
