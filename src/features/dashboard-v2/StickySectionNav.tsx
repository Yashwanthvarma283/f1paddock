import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useScrollSpy, type ScrollSpySection } from '@/hooks/useScrollSpy'
import { cn } from '@/lib/utils'

export const DASHBOARD_SECTIONS: ScrollSpySection[] = [
  { id: 'next-race', label: 'Next race' },
  { id: 'results', label: 'Results' },
  { id: 'standings', label: 'Standings' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'drivers', label: 'Drivers' },
]

export const StickySectionNav: React.FC<{ sections?: ScrollSpySection[] }> = ({
  sections = DASHBOARD_SECTIONS,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const { activeId, scrollToSection } = useScrollSpy(sections, { offset: 120 })

  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-16 z-30 w-full bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]"
    >
      <div className="mx-auto max-w-[1560px] px-5 md:px-8 lg:px-12">
        <div className="flex items-center gap-1 sm:gap-2 h-12 overflow-x-auto dv2-scroll -mx-2 px-2">
          {sections.map((section) => {
            const isActive = activeId === section.id
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(section.id)
                }}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'relative h-9 px-3 sm:px-4 rounded-[4px] inline-flex items-center text-[13px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer select-none',
                  isActive
                    ? 'text-[var(--text)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="dashboard-section-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--accent)] rounded-full"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.2, ease: [0.2, 0, 0, 1] }
                    }
                  />
                )}
                <span>{section.label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
