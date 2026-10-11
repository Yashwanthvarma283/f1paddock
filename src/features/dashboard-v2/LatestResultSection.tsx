import React from 'react'
import { useLastRaceResult } from '@/api/useF1Data'
import { getTeamMeta } from '@/lib/teams'
import { Section, SectionHeading, RowSkeleton, QuietError, Figure, Label, EMPTY } from './primitives'
import { CountUp } from './CountUp'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'motion/react'
import { DriverAvatar } from './DriverAvatar'
import { TeamLogo } from './TeamLogo'
import { StandingsSection } from './StandingsSection'

const PodiumSpot: React.FC<{ entry: any; position: 1 | 2 | 3 }> = ({ entry, position }) => {
  const teamMeta = getTeamMeta(entry.Constructor.constructorId)
  const shouldReduceMotion = useReducedMotion()

  const elevationClass = 
    position === 1 ? "mb-8 md:mb-12" :
    position === 2 ? "mb-4 md:mb-6" : "";

  return (
    <div className={cn("flex flex-col flex-1", elevationClass)}>
      {/* Photo */}
      <div className="flex justify-center mb-3">
        <div className="w-[60px] h-[60px] md:w-[72px] md:h-[72px] rounded-full overflow-hidden bg-[var(--surface-1)] border-2 border-[var(--surface-1)] shadow-sm shrink-0">
          <DriverAvatar
            driverId={entry.Driver.driverId}
            code={entry.Driver.code}
            givenName={entry.Driver.givenName}
            familyName={entry.Driver.familyName}
            className="w-full h-full object-cover object-top"
            fallbackClassName="w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold bg-[var(--surface-2)] text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Text block */}
      <div className="text-center flex flex-col items-center flex-1 w-full overflow-hidden">
        <div className="text-[12px] text-[var(--text-muted)] truncate w-full px-1">{entry.Driver.givenName}</div>
        <div className="font-bold text-[14px] md:text-[15px] uppercase tracking-tight truncate w-full px-1 leading-tight">{entry.Driver.familyName}</div>
        
        <div className="flex items-center justify-center gap-1.5 mt-1 min-w-0 px-1 w-full">
          <TeamLogo teamId={teamMeta.id} teamName={teamMeta.name} className="h-3 w-4 md:h-4 md:w-5 object-contain shrink-0" showTeamNameNextToIt={false} />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate min-w-0 hidden md:block">
            {teamMeta.name}
          </div>
        </div>

        <div className="mt-1.5 md:mt-2 text-[11px] text-[var(--text-muted)] dv2-fig truncate w-full px-1">
          {position === 1 ? entry.Time?.time || 'Winner' : entry.Time?.time || entry.status || EMPTY}
        </div>
      </div>

      {/* Step bar */}
      <div className="mt-3 flex flex-col items-center w-full px-1 md:px-2">
        <motion.div 
          className="w-full h-[4px] rounded-t-[2px] origin-bottom"
          style={{ backgroundColor: teamMeta.color }}
          initial={shouldReduceMotion ? false : { scaleY: 0 }}
          animate={shouldReduceMotion ? { scaleY: 1 } : undefined}
          whileInView={shouldReduceMotion ? undefined : { scaleY: 1 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: position * 0.1 }}
        />
        <div className="font-[family-name:var(--font-display)] text-[20px] md:text-[24px] font-bold text-[var(--text-muted)] mt-1.5">
          {position}
        </div>
      </div>
    </div>
  )
}

export const LatestResultSection: React.FC<{ id?: string }> = ({ id }) => {
  const { data: result, isLoading, isError, refetch } = useLastRaceResult()

  if (isLoading) {
    return (
      <Section id={id || 'results'}>
        <SectionHeading subtitle="Previous Race">Latest Result</SectionHeading>
        <RowSkeleton rows={10} />
      </Section>
    )
  }

  if (isError || !result || result.results.length === 0) {
    return (
      <Section id={id || 'results'}>
        <SectionHeading subtitle="Previous Race">Latest Result</SectionHeading>
        <QuietError message="Could not load latest race result." onRetry={refetch} />
      </Section>
    )
  }

  const p1 = result.results.find(r => r.position === '1')
  const p2 = result.results.find(r => r.position === '2')
  const p3 = result.results.find(r => r.position === '3')
  const p4to10 = result.results.slice(3, 10) // table shows positions 4-10

  const raceDate = new Date(result.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

  return (
    <Section id={id || 'results'}>
      <SectionHeading 
        subtitle={`Round ${result.round} - ${result.season}`}
        action={
          <div className="flex flex-row items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-0.5">Total Laps</span>
              <span className="font-mono text-[14px] font-semibold">{p1?.laps || '-'}</span>
            </div>
            <div className="w-px h-6 bg-[var(--border-subtle)]"></div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-0.5">Fastest Lap</span>
              <span className="font-mono text-[14px] font-semibold">
                {result.fastestLap ? (
                  <>
                    <span className="text-[var(--text)]">{result.fastestLap.Driver.code || result.fastestLap.Driver.familyName} - </span>
                    <span className="text-[var(--timing-purple)]">{result.fastestLap.FastestLap?.Time.time}</span>
                  </>
                ) : '-'}
              </span>
            </div>
          </div>
        }
      >
        {result.raceName}
        <div className="font-sans text-[13px] md:text-[14px] font-normal tracking-normal normal-case text-[var(--text-muted)] mt-1.5 md:mt-2">
          {result.Circuit.circuitName} &bull; {raceDate}
        </div>
      </SectionHeading>
      
      {/* 
        Using display: contents on lg breakpoint to flatten the DOM structure 
        so we can control mobile ordering (flex flex-col) versus desktop (grid).
        Desktop order: Left (Podium, Table), Right (Standings).
        Mobile order: Podium, Table (Driver Pos), Standings. 
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:mt-8 relative">
        
        {/* Podium - order 1 */}
        <div className="order-1 lg:col-span-7 flex flex-col">
          <div className="flex items-end justify-center gap-2 sm:gap-4 lg:gap-6 mt-4 lg:mt-6 px-2 sm:px-4">
            {p2 && <PodiumSpot entry={p2} position={2} />}
            {p1 && <PodiumSpot entry={p1} position={1} />}
            {p3 && <PodiumSpot entry={p3} position={3} />}
          </div>
        </div>

        {/* Classification Table (Driver Pos) - order 2 on mobile, spans 7 cols on desktop (left col) */}
        <div className="order-2 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-2 flex flex-col mt-4 lg:mt-0">
          <div className="border-t border-[var(--border-subtle)]">
            <div className="flex items-center px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
              <Label className="w-8">Pos</Label>
              <Label className="flex-1">Driver</Label>
              <Label className="w-20 sm:w-24 text-right">Time</Label>
              <Label className="w-10 sm:w-12 text-right ml-3 sm:ml-4">Pts</Label>
            </div>
            
            <div className="divide-y divide-[var(--border-subtle)] flex flex-col">
              {p4to10.map((item) => {
                const teamMeta = getTeamMeta(item.Constructor.constructorId)
                
                return (
                  <div 
                    key={item.Driver.driverId} 
                    className="group relative flex items-center px-4 py-3 hover:bg-[var(--surface-1)] transition-colors duration-150 overflow-hidden"
                  >
                    {/* Hover slide-in highlight edge */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 -translate-x-full group-hover:translate-x-0 transition-transform duration-150 ease-[var(--ease-out)]"
                      style={{ backgroundColor: teamMeta.color }}
                      aria-hidden="true"
                    />

                    <div className="w-8 flex items-center">
                      <Figure className="text-[14px] font-medium text-[var(--text-muted)]">
                        {item.position}
                      </Figure>
                    </div>
                    
                    <div className="flex-1 flex flex-col min-w-0 pr-2">
                      <div className="font-semibold text-[14px] sm:text-[15px] group-hover:text-[var(--accent)] transition-colors duration-150 truncate">
                        {item.Driver.givenName} <span className="uppercase">{item.Driver.familyName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <TeamLogo teamId={teamMeta.id} teamName={teamMeta.name} className="h-3 w-4 object-contain shrink-0" showTeamNameNextToIt={false} />
                        <div className="text-[var(--text-muted)] text-[11px] sm:text-[12px] truncate">
                          {item.Constructor.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-20 sm:w-24 text-right shrink-0">
                      <span className="truncate block w-full" title={item.Time?.time || item.status}>
                        <Figure className="text-[12px] sm:text-[13px] text-[var(--text-muted)]">
                          {item.Time?.time || item.status || EMPTY}
                        </Figure>
                      </span>
                    </div>
                    
                    <div className="w-10 sm:w-12 text-right ml-3 sm:ml-4 shrink-0">
                      <Figure className="text-[14px] sm:text-[15px] font-bold">
                        <CountUp value={item.points} className="text-[14px] sm:text-[15px] font-bold" />
                      </Figure>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Standings - order 3 on mobile, spans 5 cols on desktop (right col) */}
        <div className="order-3 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 flex flex-col mt-4 lg:mt-0">
          <StandingsSection />
        </div>

      </div>
    </Section>
  )
}
