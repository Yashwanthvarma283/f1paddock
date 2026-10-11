import type { ReactNode } from 'react'
import { Section } from '@/features/dashboard-v2/primitives'

export function WeekendSection({ id, title, action, children }: {
  id: string; title: string; action?: ReactNode; children: ReactNode
}) {
  return (
    <Section id={id} labelledBy={`${id}-heading`} className="rw-section rw-anchor">
      <span data-rw-spy aria-hidden="true" className="rw-spy" />
      <div className="rw-section-heading">
        <h2 id={`${id}-heading`}>{title}</h2>
        {action}
      </div>
      {children}
    </Section>
  )
}
