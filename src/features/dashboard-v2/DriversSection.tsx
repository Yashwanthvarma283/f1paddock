import React from 'react'
import { useDriverStandings } from '@/api/useF1Data'
import { getTeamMeta } from '@/lib/teams'
import { CountryFlag } from '@/lib/flags'
import { Section, SectionHeading, QuietError, Figure } from './primitives'
import { motion, useReducedMotion } from 'motion/react'
import { TeamLogo } from './TeamLogo'

export const DriversSection: React.FC<{ id?: string }> = ({ id }) => {
  const { data: drivers, isLoading, isError, refetch } = useDriverStandings()
  const shouldReduceMotion = useReducedMotion()
  const [itemsVisible, setItemsVisible] = React.useState(Boolean(shouldReduceMotion))

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
      <Section id={id || 'drivers'}>
        <SectionHeading subtitle="Grid Roster">Drivers</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-8 border-t border-[var(--border-subtle)] pt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--surface-1)] rounded-[4px] border border-[var(--border-subtle)] skeleton-shimmer" />
          ))}
        </div>
      </Section>
    )
  }

  if (isError || !drivers) {
    return (
      <Section id={id || 'drivers'}>
        <SectionHeading subtitle="Grid Roster">Drivers</SectionHeading>
        <QuietError message="Could not load drivers." onRetry={refetch} />
      </Section>
    )
  }

  return (
    <Section id={id || 'drivers'}>
      <SectionHeading subtitle="Grid Roster">Drivers</SectionHeading>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-8 border-t border-[var(--border-subtle)] pt-8">
        {drivers.map((item, idx) => {
          const teamMeta = getTeamMeta(item.constructor.constructorId)
          return (
            <motion.div 
              key={item.driver.driverId}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={itemsVisible ? { opacity: 1, y: 0 } : undefined}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, delay: idx * 0.05 }}
              className="h-full"
            >
              <div 
                className="group relative flex flex-col justify-between h-24 p-4 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] overflow-hidden dv2-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                tabIndex={0}
              >
                <div 
                  className="absolute top-0 right-0 bottom-0 w-[4px] transition-all duration-150 group-hover:w-[6px] group-focus-visible:w-[6px]" 
                  style={{ backgroundColor: teamMeta.color }} 
                />
                
                <div className="flex justify-between items-start pr-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[15px] leading-tight group-hover:text-[var(--accent)] transition-colors duration-150">
                      {item.driver.givenName} <span className="uppercase">{item.driver.familyName}</span>
                    </span>
                    <div className="flex items-center gap-2 mt-1 flex-nowrap min-w-0">
                      <TeamLogo teamId={teamMeta.id} teamName={teamMeta.name} className="h-4 w-5 object-contain shrink-0" showTeamNameNextToIt={false} />
                      <span className="text-[13px] text-[var(--text-muted)] truncate min-w-0" title={item.constructor.name}>
                        {item.constructor.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 relative z-10">
                    <CountryFlag country={item.driver.nationality} className="w-5 h-5 rounded-[2px]" />
                  </div>
                </div>
                
                <div className="flex justify-between items-end pr-4 relative z-10">
                  <div className="text-[18px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors duration-150">
                    {item.driver.permanentNumber ? (
                      <>
                        <span className="text-[12px] font-medium mr-1 uppercase tracking-widest opacity-60">No.</span>
                        <Figure>{item.driver.permanentNumber}</Figure>
                      </>
                    ) : '-'}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}
