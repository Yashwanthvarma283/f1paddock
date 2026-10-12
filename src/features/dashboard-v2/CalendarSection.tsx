import React, { useState } from 'react'
import { useSchedule } from '@/api/useF1Data'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { CountryFlag } from '@/lib/flags'
import { Section, SectionHeading, RowSkeleton, QuietError, Figure, Label, orDash } from './primitives'
import { CountUp } from './CountUp'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'


export const CalendarSection: React.FC<{ id?: string }> = ({ id }) => {
  const [expanded, setExpanded] = useState(false)
  const { data: schedule, isLoading, isError, refetch } = useSchedule('current')
  const tz = useTimezone()
  const shouldReduceMotion = useReducedMotion()
  const [itemsVisible, setItemsVisible] = useState(Boolean(shouldReduceMotion))

  React.useEffect(() => {
    if (shouldReduceMotion) {
      setItemsVisible(true)
      return
    }
    const timer = setTimeout(() => {
      setItemsVisible(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [shouldReduceMotion])

  if (isLoading) {
    return (
      <Section id={id || 'calendar'}>
        <SectionHeading>Calendar</SectionHeading>
        <RowSkeleton rows={10} className="mt-8 border-t border-[var(--border-subtle)]" />
      </Section>
    )
  }

  if (isError || !schedule) {
    return (
      <Section id={id || 'calendar'}>
        <SectionHeading>Calendar</SectionHeading>
        <QuietError message="Could not load the calendar." onRetry={refetch} />
      </Section>
    )
  }

  // Find current race index
  const nextRace = SessionService.findNextRace(schedule.races)
  const nextIdx = nextRace ? schedule.races.findIndex(r => r.round === nextRace.round) : schedule.races.length
  
  // Progress Bar calculations
  const totalRounds = schedule.races.length
  const completedRounds = nextIdx

  // Default rows: 1 past + next 5
  const startIdx = Math.max(0, nextIdx - 1)
  const defaultList = schedule.races.slice(startIdx, startIdx + 6)
  const displayList = expanded ? schedule.races : defaultList

  return (
    <Section id={id || 'calendar'}>
      <SectionHeading subtitle="Season Schedule">
        Calendar
      </SectionHeading>

      {/* Season Progress */}
      <div className="mb-8 mt-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[12px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Season Progress</span>
          <span className="dv2-fig font-bold text-[14px]">
            <CountUp value={completedRounds} /> / {totalRounds}
          </span>
        </div>
        <div className="relative h-2 bg-[var(--surface-2)] rounded-full overflow-hidden flex">
          {schedule.races.map((race, i) => (
            <div key={race.round} className="flex-1 border-r border-[var(--bg)] last:border-0 relative h-full">
              {i < completedRounds && (
                <motion.div 
                  className="absolute inset-0 bg-[var(--accent)]"
                  initial={shouldReduceMotion ? false : { scaleX: 0 }}
                  animate={itemsVisible ? { scaleX: 1 } : undefined}
                  whileInView={shouldReduceMotion ? undefined : { scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: i * 0.05 }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 border-t border-[var(--border-subtle)]">
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <Label className="w-12">Rnd</Label>
          <Label className="w-32 hidden md:block">Dates</Label>
          <Label className="flex-1">Grand Prix</Label>
          <Label className="w-32 hidden sm:block">Status</Label>
        </div>
        
        <motion.div layout className="divide-y divide-[var(--border-subtle)]">
          <AnimatePresence initial={false}>
            {displayList.map((race) => {
              const sessions = SessionService.extractWeekendSessions(race)
              const firstSession = sessions[0]
              const lastSession = sessions[sessions.length - 1]
              
              let dates = null
              if (firstSession && lastSession) {
                const start = new Date(firstSession.startTimeIso)
                const end = new Date(lastSession.startTimeIso)
                const startDay = new Intl.DateTimeFormat('en-GB', { timeZone: tz.timezone, day: 'numeric' }).format(start)
                const endDay = new Intl.DateTimeFormat('en-GB', { timeZone: tz.timezone, day: 'numeric' }).format(end)
                const startMonth = new Intl.DateTimeFormat('en-GB', { timeZone: tz.timezone, month: 'short' }).format(start)
                const endMonth = new Intl.DateTimeFormat('en-GB', { timeZone: tz.timezone, month: 'short' }).format(end)
                dates = startMonth === endMonth ? `${startDay}-${endDay} ${endMonth}` : `${startDay} ${startMonth} - ${endDay} ${endMonth}`
              } else if (race.date) {
                dates = tz.formatWeekendSpan(race.date)
              }

              const isPast = lastSession?.isFinished
              const isActive = sessions.some(s => s.isLive)
              
              let statusText = 'Upcoming'
              if (isActive) statusText = 'Live'
              else if (isPast) statusText = 'Finished'

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  key={race.round} 
                  className={cn(
                    'group flex items-center px-4 py-1.5 sm:py-4 min-h-[56px] hover:bg-[var(--surface-1)] transition-colors duration-150 overflow-hidden',
                    isPast && 'opacity-60 hover:opacity-100'
                  )}
                >
                  {/* Mobile (below 640px): 2 lines */}
                  <div className="flex sm:hidden flex-col justify-center w-full min-h-[56px] py-2">
                    {/* Line 1: round, flag, Grand Prix name (wrap if needed) */}
                    <div className="flex items-center gap-2.5">
                      <Figure className="text-[14px] font-medium text-[var(--text-muted)] w-6 shrink-0">
                        {String(race.round).padStart(2, '0')}
                      </Figure>
                      {race.Circuit?.Location?.country && (
                        <CountryFlag country={race.Circuit.Location.country} className="w-5 h-5 rounded-[2px] shrink-0" />
                      )}
                      <span className="font-semibold text-[15px] leading-tight text-[var(--text)]">
                        {race.raceName}
                      </span>
                    </div>
                    {/* Line 2 muted: dates and circuit on left, status as plain text on right */}
                    <div className="flex items-center justify-between mt-1.5 pl-[34px] text-[12px] text-[var(--text-muted)]">
                      <span className="truncate pr-2">
                        <span className="dv2-fig">{orDash(dates)}</span>
                        <span className="mx-1.5 opacity-50">•</span>
                        <span>{race.Circuit.circuitName}</span>
                      </span>
                      <span className="uppercase text-[11px] font-medium tracking-wider shrink-0 text-[var(--text-muted)]">
                        {statusText}
                      </span>
                    </div>
                  </div>

                  {/* Desktop (640px+): single row unchanged */}
                  <div className="hidden sm:flex items-center w-full">
                    <div className="w-12 shrink-0">
                      <Figure className="text-[14px] font-medium text-[var(--text-muted)]">{String(race.round).padStart(2, '0')}</Figure>
                    </div>
                    
                    <div className="w-32 shrink-0 hidden md:block">
                      <Figure className="text-[13px] font-medium">{orDash(dates)}</Figure>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4 min-w-0 pr-4">
                      <div className="flex items-center gap-3 shrink-0">
                        {race.Circuit.Location.country && <CountryFlag country={race.Circuit.Location.country} className="w-6 h-6 rounded-[2px]" />}
                        <span className="font-semibold text-[15px]">{race.raceName}</span>
                      </div>
                      <span className="text-[13px] text-[var(--text-muted)] truncate min-w-0" title={race.Circuit.circuitName}>
                        {race.Circuit.circuitName}
                      </span>
                    </div>
                    
                    <div className="w-32 shrink-0">
                      <span className={cn(
                        'text-[13px] font-semibold uppercase tracking-wider',
                        isActive ? 'text-[var(--accent)]' : (isPast ? 'text-[var(--text-muted)]' : 'text-[var(--text)]')
                      )}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {!expanded && schedule.races.length > defaultList.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setExpanded(true)}
            className="dv2-link text-[13px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-2 px-4 cursor-pointer"
          >
            Show all rounds
          </button>
        </div>
      )}
    </Section>
  )
}
