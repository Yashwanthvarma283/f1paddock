import React, { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { CountryFlag } from '@/lib/flags'
import { Figure, Label, orDash } from '@/features/dashboard-v2/primitives'
import { useNow } from '@/hooks/useNow'
import type { RaceWeekendModel } from './types'
import {
  formatCountdown,
  formatDateInTimezone,
  formatSessionType,
  formatTimeInTimezone,
  formatWeekendDates,
  getNextSession,
  getSessionState,
} from './utils'
import { useRenderCount } from './RenderTelemetry'

interface WeekendHeroProps {
  model: RaceWeekendModel
}

export const WeekendCountdown: React.FC<{
  model: RaceWeekendModel
  compact?: boolean
}> = ({ model, compact = false }) => {
  useRenderCount(compact ? 'compact-countdown' : 'hero-countdown')
  const now = useNow(1000)
  const nextSession = getNextSession(model.sessions, now)
  const state = nextSession ? getSessionState(nextSession, now) : null
  const target = state === 'running' ? nextSession?.endTimeIso : nextSession?.startTimeIso
  const label = state === 'running' ? 'Ends in' : 'Next session'

  if (compact) {
    const compactLabel = state === 'running'
      ? `Ends · ${nextSession ? nextSession.type : 'session'}`
      : nextSession
        ? `Next · ${nextSession.type}`
        : 'Complete'
    return (
      <div className="rw-compact-countdown" aria-label={`${compactLabel} ${formatCountdown(target ?? null, now)}`}>
        <span>{compactLabel}</span>
        <Figure>{formatCountdown(target ?? null, now)}</Figure>
      </div>
    )
  }

  return (
    <div className="rw-countdown">
      <Label>{label}</Label>
      <Figure className={compact ? 'text-[16px] font-semibold' : 'text-[30px] md:text-[42px] font-semibold leading-none'}>
        {formatCountdown(target ?? null, now)}
      </Figure>
      <span className="text-[12px] text-[var(--text-muted)]">
        {nextSession ? formatSessionType(nextSession.type) : model.weekendState === 'completed' ? 'Weekend complete' : 'No later session scheduled'}
      </span>
    </div>
  )
}

export const WeekendHero: React.FC<WeekendHeroProps> = ({ model }) => {
  useRenderCount('hero')
  const reduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const timezone = model.selectedTimezone
  const nextSession = useMemo(() => getNextSession(model.sessions), [model.sessions])
  const stateLabel = useMemo(() => {
    if (model.weekendState === 'in-progress') return 'Running now'
    if (model.weekendState === 'completed') return 'Weekend complete'
    return 'Upcoming weekend'
  }, [model.weekendState])

  useEffect(() => {
    if (!location.hash) { window.scrollTo(0, 0); headingRef.current?.focus({ preventScroll: true }) }
  }, [model.race.round])
  return (
    <>
      <section id="weekend" aria-labelledby="weekend-heading" className="rw-hero rw-anchor">
        <span data-rw-spy className="rw-spy" aria-hidden="true" />
        <div className="rw-container">
          <Link to="/test/dashboard" className="rw-back-link dv2-link">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>

          <div className="rw-hero-grid">
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, transform: 'translateY(8px)' }}
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="rw-round-line">
                <Figure>Round {model.race.round}</Figure>
                <span aria-hidden="true">/</span>
                <Figure>{model.year}</Figure>
                <span className="rw-state-text">{stateLabel}</span>
              </div>
              <h1
                id="weekend-heading"
                ref={headingRef}
                tabIndex={-1}
                className="rw-title"
                style={{ viewTransitionName: 'raceweekend-title' }}
              >
                {model.race.raceName}
              </h1>
              <div className="rw-hero-meta">
                <div>
                  <Label>Circuit</Label>
                  <p>{orDash(model.race.Circuit.circuitName)}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="rw-location">
                    <CountryFlag country={model.race.Circuit.Location.country} className="h-4 w-6 rounded-[2px]" />
                    {orDash(model.race.Circuit.Location.locality)}, {orDash(model.race.Circuit.Location.country)}
                  </p>
                </div>
                <div>
                  <Label>Dates</Label>
                  <p className="dv2-fig">{formatWeekendDates(model.sessions, timezone)}</p>
                </div>
              </div>
            </motion.div>

            <motion.aside
              className="rw-hero-panel"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, transform: 'translateY(8px)' }}
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              transition={{ duration: 0.24, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Next session"
            >
              <WeekendCountdown model={model} />
              <div className="rw-panel-divider" />
              <div className="rw-next-session">
                <Label>Selected timezone</Label>
                <div className="rw-timezone-row">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <Figure>{timezone}</Figure>
                </div>
                {nextSession ? (
                  <p className="rw-next-session-time">
                    {formatDateInTimezone(nextSession.startTimeIso, timezone)} · {formatTimeInTimezone(nextSession.startTimeIso, timezone, model.is24h)}
                  </p>
                ) : (
                  <p className="rw-next-session-time">No remaining session in this weekend</p>
                )}
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </>
  )
}

export const CompactWeekendBar: React.FC<{ model: RaceWeekendModel }> = ({ model }) => (
  <div className="rw-compact-bar">
    <div className="rw-compact-leading">
      <span className="rw-compact-round">R{String(model.race.round).padStart(2, '0')}</span>
      <span className="rw-compact-name">{model.race.raceName}</span>
    </div>
    <WeekendCountdown model={model} compact />
  </div>
)
