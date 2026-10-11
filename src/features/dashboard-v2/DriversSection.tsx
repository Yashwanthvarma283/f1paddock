import React from 'react'
import { useDriverStandings } from '@/api/useF1Data'
import { getTeamMeta } from '@/lib/teams'
import { CountryFlag } from '@/lib/flags'
import { Section, SectionHeading, QuietError, Figure } from './primitives'
import { motion, useReducedMotion } from 'motion/react'
import { TeamLogo } from './TeamLogo'
import { DriverAvatar } from './DriverAvatar'

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
      
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mt-8 border-t border-[var(--border-subtle)] pt-8">
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
                className="relative flex items-center gap-3 p-3 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] overflow-hidden min-h-[76px]"
              >
                <div 
                  className="absolute top-0 right-0 bottom-0 w-[4px]" 
                  style={{ backgroundColor: teamMeta.color }} 
                />
                
                <DriverAvatar
                  driverId={item.driver.driverId}
                  code={item.driver.code}
                  givenName={item.driver.givenName}
                  familyName={item.driver.familyName}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover shrink-0 bg-[var(--surface-2)]"
                  fallbackClassName="w-12 h-12 text-[12px]"
                />

                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[14px] sm:text-[15px] leading-tight truncate text-[var(--text)]" title={`${item.driver.givenName} ${item.driver.familyName}`}>
                      <span className="hidden min-[480px]:inline font-normal text-[var(--text-muted)] mr-1">{item.driver.givenName}</span>
                      <span className="uppercase">{item.driver.familyName}</span>
                    </span>
                    <CountryFlag country={item.driver.nationality} className="w-4 h-4 rounded-[2px] shrink-0" />
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <TeamLogo teamId={teamMeta.id} teamName={teamMeta.name} className="h-3.5 w-4 object-contain shrink-0" showTeamNameNextToIt={false} />
                      <span className="text-[12px] text-[var(--text-muted)] truncate" title={item.constructor.name}>
                        {item.constructor.name}
                      </span>
                    </div>
                    
                    <div className="text-[13px] font-bold text-[var(--text-muted)] shrink-0 pl-1">
                      {item.driver.permanentNumber ? (
                        <>
                          <span className="text-[11px] font-medium mr-0.5 uppercase tracking-wider opacity-60">No.</span>
                          <Figure>{item.driver.permanentNumber}</Figure>
                        </>
                      ) : '-'}
                    </div>
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
