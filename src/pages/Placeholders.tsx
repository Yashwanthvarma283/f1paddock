import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, Shield, Flag } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PlaceholderPageProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  badge: string
}

const BasePlaceholder: React.FC<PlaceholderPageProps> = ({ title, subtitle, icon, badge }) => {
  return (
    <div className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-block mb-8">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
          Back to F1 Paddock Home
        </Button>
      </Link>

      <div className="f1-card-accent p-8 sm:p-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-center space-y-4 shadow-[var(--card-shadow)]">
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--accent)] shadow-xs">
          {icon}
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-glow-subtle)] border border-[var(--accent)] font-bold">
          {badge}
        </span>

        <h1 className="font-display font-black text-3xl sm:text-4xl text-[var(--text)] uppercase tracking-tight">
          {title}
        </h1>

        <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed font-sans">
          {subtitle}
        </p>

        <div className="pt-6 border-t border-[var(--border)] flex items-center justify-center gap-4 text-xs font-mono text-[var(--text-muted)]">
          <span>COMING SOON</span>
          <span>&bull;</span>
          <span>UNDER DEVELOPMENT</span>
        </div>
      </div>
    </div>
  )
}

export const CalendarPage: React.FC = () => (
  <BasePlaceholder
    title="Championship Calendar"
    subtitle="Full 24-round season calendar with circuit telemetry, sprint formats, and local session times."
    icon={<Calendar className="w-6 h-6" />}
    badge="CALENDAR TELEMETRY"
  />
)

export const DriversPage: React.FC = () => (
  <BasePlaceholder
    title="Drivers Championship"
    subtitle="Driver standings, career statistics, telemetry deltas, and head-to-head teammate comparisons."
    icon={<Users className="w-6 h-6" />}
    badge="DRIVER ROSTER"
  />
)

export const TeamsPage: React.FC = () => (
  <BasePlaceholder
    title="Constructors Championship"
    subtitle="Constructor standings, team liveries, points distribution, and technical power unit telemetry."
    icon={<Shield className="w-6 h-6" />}
    badge="CONSTRUCTOR TELEMETRY"
  />
)

export const RaceWeekendPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <BasePlaceholder
      title={`Race Weekend Telemetry (${id || 'Current Round'})`}
      subtitle={`Session timings, live sector deltas, tire compound history, and classification for ${id || 'this round'}.`}
      icon={<Flag className="w-6 h-6" />}
      badge="GRAND PRIX WEEKEND"
    />
  )
}
