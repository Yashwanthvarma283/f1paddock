import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Trophy, Flag, Users, Flame, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useSchedule } from '@/api/useF1Data'
import { useSeasonInsights } from '@/api/useSeasonInsights'
import { getTeamMeta } from '@/lib/teams'
import { TeamLogo } from './TeamLogo'
import { DriverAvatar } from './DriverAvatar'
import { SectionHeading, Figure, Label } from './primitives'
import { cn } from '@/lib/utils'
import type { SpotlightHistoryPoint } from './insights/types'

type InsightTab = 'craft' | 'qualifying' | 'teammates' | 'streaks'

const TABS: { id: InsightTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'craft', label: 'Race craft', icon: Flag },
  { id: 'qualifying', label: 'Qualifying', icon: Trophy },
  { id: 'teammates', label: 'Teammates', icon: Users },
  { id: 'streaks', label: 'Streaks', icon: Flame },
]

/**
 * Inline SVG Sparkline for season race finish trajectory
 * Inverted Y-axis so P1 sits at the top. Open circles mark DNFs.
 */
const FinishSparkline: React.FC<{
  history: SpotlightHistoryPoint[]
  color?: string
  className?: string
}> = ({ history, color = 'var(--accent)', className }) => {
  const shouldReduceMotion = useReducedMotion()
  if (!history || history.length === 0) return null

  const width = 280
  const height = 90
  const xPad = 14
  const yPad = 12
  const innerW = width - xPad * 2
  const innerH = height - yPad * 2

  const n = history.length
  const points = history.map((pt, i) => {
    const x = n > 1 ? xPad + (i / (n - 1)) * innerW : width / 2
    // Position range 1 to 22
    const pos = pt.position ?? 22
    const clampedPos = Math.max(1, Math.min(22, pos))
    const y = pt.isDnf ? height - yPad : yPad + ((clampedPos - 1) / 21) * innerH
    return { x, y, isDnf: pt.isDnf, pos: pt.position, round: pt.round }
  })

  const pathD = points.reduce((acc, curr, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`
  }, '')

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mb-1 px-1">
        <span>R1</span>
        <span className="text-[11px] uppercase tracking-wider opacity-75">Finishing Trajectory</span>
        <span>R{n}</span>
      </div>
      <div className="relative w-full h-[90px] bg-[var(--surface-2)]/40 rounded-[4px] border border-[var(--border-subtle)] overflow-hidden">
        {/* Subtle reference gridlines for P1, P10, P20 */}
        <div className="absolute inset-x-0 top-[12px] border-b border-[var(--border-subtle)]/40 pointer-events-none" />
        <div className="absolute inset-x-0 top-[48px] border-b border-[var(--border-subtle)]/30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-[12px] border-b border-[var(--border-subtle)]/40 pointer-events-none" />

        <div className="absolute left-1.5 top-[3px] text-[11px] font-mono text-[var(--text-muted)]/60 pointer-events-none">
          P1
        </div>
        <div className="absolute left-1.5 top-[39px] text-[11px] font-mono text-[var(--text-muted)]/60 pointer-events-none">
          P10
        </div>
        <div className="absolute left-1.5 bottom-[2px] text-[11px] font-mono text-[var(--text-muted)]/60 pointer-events-none">
          P20+
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Sparkline trace */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={shouldReduceMotion ? undefined : 'dv2-sparkline-path'}
          />

          {/* Markers */}
          {points.map((pt, i) => (
            <g key={i}>
              {pt.isDnf ? (
                // Open circle for DNF
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="var(--surface-1)"
                  stroke={color}
                  strokeWidth="2"
                />
              ) : (
                // Solid dot for classified finishes
                <circle cx={pt.x} cy={pt.y} r="2.5" fill={color} />
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-end gap-3 mt-1.5 px-1 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span>Classified</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full border border-current bg-transparent"
            style={{ borderColor: color }}
          />
          <span>DNF</span>
        </span>
      </div>
    </div>
  )
}

export const DriversSection: React.FC<{ id?: string }> = ({ id = 'drivers' }) => {
  const { data: schedule } = useSchedule('current')
  const currentSeason = schedule?.season || 'current'

  const sectionRef = useRef<HTMLElement>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)
  const [activeTab, setActiveTab] = useState<InsightTab>('craft')
  const shouldReduceMotion = useReducedMotion()

  // Defer fetching until section is within 1 viewport height
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearViewport(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { data: insights, isLoading, isError, refetch } = useSeasonInsights(
    currentSeason,
    isNearViewport
  )

  const completedRounds = insights?.completedRounds ?? 0
  const isEarlySeason = !isLoading && !isError && completedRounds < 3

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative w-full text-[var(--text)] scroll-mt-[80px]"
    >
      {/* 1. Sticky Section Heading */}
      <SectionHeading
        subtitle={completedRounds > 0 ? `After Round ${completedRounds}` : 'Season Intel'}
        action={
          <Link
            to="/drivers"
            className="dv2-link text-[12px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>All drivers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        Driver Insights
      </SectionHeading>

      {/* 2. Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[440px]">
          <div className="lg:col-span-5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-6 skeleton-shimmer min-h-[380px]" />
          <div className="lg:col-span-7 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-6 skeleton-shimmer min-h-[380px]" />
        </div>
      )}

      {/* 3. Quiet Error State */}
      {isError && (
        <div className="p-6 rounded-[4px] bg-[var(--surface-1)] border border-[var(--border-subtle)] text-center my-6">
          <p className="text-[13px] text-[var(--text-muted)]">Could not load driver season insights.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* 4. Early-Season Quiet State (< 3 completed rounds) */}
      {isEarlySeason && (
        <div className="mb-6 p-6 rounded-[4px] bg-[var(--surface-1)] border border-[var(--border-subtle)] text-center">
          <p className="text-[13px] text-[var(--text-muted)] font-medium">
            Insights appear after round 3 as classification sample sizes mature.
          </p>
        </div>
      )}

      {/* 5. Main Dashboard Insights Layout */}
      {!isLoading && !isError && !isEarlySeason && insights && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: 5-Column Spotlight Card */}
          {insights.spotlight && (
            <div className="lg:col-span-5 flex flex-col bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-5 md:p-6 relative overflow-hidden shadow-xs">
              {/* Livery accent top border */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{
                  backgroundColor: getTeamMeta(insights.spotlight.constructorId).color,
                }}
              />

              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.1em] font-semibold text-[var(--accent)]">
                  Driver Spotlight
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                  Momentum
                </span>
              </div>

              {/* Driver Header */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <DriverAvatar
                    driverId={insights.spotlight.driverId}
                    givenName={insights.spotlight.givenName}
                    familyName={insights.spotlight.familyName}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover shrink-0 bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                    fallbackClassName="w-14 h-14 text-[13px] font-mono"
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] text-[var(--text-muted)] leading-none truncate">
                      {insights.spotlight.givenName}
                    </div>
                    <div className="font-[family-name:var(--font-display)] font-extrabold text-[20px] uppercase text-[var(--text)] tracking-tight leading-tight truncate">
                      {insights.spotlight.familyName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TeamLogo
                        teamId={insights.spotlight.constructorId}
                        teamName={insights.spotlight.constructorName}
                        className="h-3.5 w-4 object-contain shrink-0"
                        showTeamNameNextToIt={false}
                      />
                      <span className="text-[11px] text-[var(--text-muted)] truncate">
                        {insights.spotlight.constructorName}
                      </span>
                    </div>
                  </div>
                </div>

                {insights.spotlight.permanentNumber && (
                  <div className="shrink-0 flex items-center px-2.5 py-1 bg-[var(--surface-2)] rounded-[4px] border border-[var(--border-subtle)] font-mono text-[13px] font-bold text-[var(--text)]">
                    <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mr-0.5">
                      #
                    </span>
                    <Figure>{insights.spotlight.permanentNumber}</Figure>
                  </div>
                )}
              </div>

              {/* Sparkline Chart */}
              <div className="my-3">
                <FinishSparkline
                  history={insights.spotlight.history}
                  color={getTeamMeta(insights.spotlight.constructorId).color}
                />
              </div>

              {/* Plain Sentence Description */}
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-2 border-t border-[var(--border-subtle)] pt-3.5">
                {insights.spotlight.reasonSentence}
              </p>
            </div>
          )}

          {/* RIGHT: 7-Column Tabbed Panel with Min-Height to Prevent Layout Shift */}
          <div className="lg:col-span-7 flex flex-col bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-5 md:p-6 shadow-xs dv2-insights-panel">
            {/* Tab Pill Toggle Bar with Sliding Pill Appearance */}
            <div className="flex items-center p-1 bg-[var(--surface-2)] rounded-full border border-[var(--border-subtle)] mb-5 overflow-x-auto dv2-scroll">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative flex-1 py-1.5 px-3 rounded-full text-[12px] font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap text-center outline-none',
                      isActive
                        ? 'bg-[var(--surface-1)] text-[var(--text)] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Content Cross-Fading (200ms with 6px vertical shift) */}
            <div className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {/* 1. Race craft Tab */}
                {activeTab === 'craft' && (
                  <motion.div
                    key="craft"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col flex-1"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border-subtle)]">
                      <Label>Average Places Gained (Min 3 Starts)</Label>
                      <Label>Avg Gained</Label>
                    </div>

                    <div className="flex flex-col gap-2.5 mb-5">
                      {insights.raceCraft.topPlacesGained.map((d, i) => {
                        const meta = getTeamMeta(d.constructorId)
                        // Bar percentage scaled against highest average
                        const maxVal = Math.max(
                          insights.raceCraft.topPlacesGained[0]?.avgPlacesGained || 1,
                          1
                        )
                        const pct = Math.max(8, Math.min(100, (d.avgPlacesGained / maxVal) * 100))

                        return (
                          <div key={d.driverId} className="flex items-center gap-3">
                            <span className="w-4 text-[12px] font-mono text-[var(--text-muted)] shrink-0">
                              {i + 1}
                            </span>
                            <div className="w-16 shrink-0 flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[13px] text-[var(--text)]">
                                {d.code}
                              </span>
                              <TeamLogo
                                teamId={d.constructorId}
                                teamName={d.constructorName}
                                className="h-3 w-3 object-contain shrink-0"
                                showTeamNameNextToIt={false}
                              />
                            </div>

                            {/* Team-colour bar */}
                            <div className="flex-1 h-3.5 bg-[var(--surface-2)] rounded-[4px] overflow-hidden flex items-center">
                              <div
                                className={shouldReduceMotion ? 'h-full rounded-[4px]' : 'h-full rounded-[4px] dv2-bar-animated'}
                                style={
                                  {
                                    width: `${pct}%`,
                                    backgroundColor: meta.color,
                                    '--bar-i': i,
                                  } as React.CSSProperties
                                }
                              />
                            </div>

                            <span className="w-14 text-right dv2-fig font-mono font-bold text-[13px] text-[var(--text)] shrink-0">
                              {d.avgPlacesGained > 0 ? `+${d.avgPlacesGained.toFixed(2)}` : d.avgPlacesGained.toFixed(2)}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Best comeback callout */}
                    {insights.raceCraft.bestComeback && (
                      <div className="p-3 bg-[var(--surface-2)]/60 rounded-[4px] border border-[var(--border-subtle)] mb-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                            Single Best Comeback
                          </span>
                          <span className="font-semibold text-[13px] text-[var(--text)] truncate block mt-0.5">
                            {insights.raceCraft.bestComeback.givenName}{' '}
                            {insights.raceCraft.bestComeback.familyName} ({insights.raceCraft.bestComeback.raceName})
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                            P{insights.raceCraft.bestComeback.grid} → P{insights.raceCraft.bestComeback.position}
                          </span>
                          <span className="font-mono font-bold text-[14px] text-[var(--accent)] dv2-fig">
                            +{insights.raceCraft.bestComeback.placesGained} places
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fastest Laps top 3 */}
                    <div className="mt-auto pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                      <Label>Most Fastest Laps:</Label>
                      <div className="flex items-center gap-4">
                        {insights.raceCraft.fastestLapsTop3.map((fl, i) => (
                          <div key={fl.driverId} className="flex items-center gap-1.5 text-[12px]">
                            <span className="text-[var(--text-muted)] font-mono">{i + 1}.</span>
                            <span className="font-bold text-[var(--text)] font-mono">{fl.code}</span>
                            <span className="text-[var(--text-muted)] dv2-fig">({fl.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. Qualifying Tab */}
                {activeTab === 'qualifying' && (
                  <motion.div
                    key="qualifying"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col flex-1"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border-subtle)]">
                      <Label>Pole Positions</Label>
                      <Label>Poles</Label>
                    </div>

                    <div className="flex flex-col gap-2.5 mb-5">
                      {insights.qualifying.topPoles.map((d, i) => {
                        const meta = getTeamMeta(d.constructorId)
                        const maxPoles = Math.max(insights.qualifying.topPoles[0]?.count || 1, 1)
                        const pct = Math.max(8, (d.count / maxPoles) * 100)

                        return (
                          <div key={d.driverId} className="flex items-center gap-3">
                            <span className="w-4 text-[12px] font-mono text-[var(--text-muted)] shrink-0">
                              {i + 1}
                            </span>
                            <div className="w-16 shrink-0 flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[13px] text-[var(--text)]">
                                {d.code}
                              </span>
                              <TeamLogo
                                teamId={d.constructorId}
                                teamName=""
                                className="h-3 w-3 object-contain shrink-0"
                                showTeamNameNextToIt={false}
                              />
                            </div>

                            <div className="flex-1 h-3.5 bg-[var(--surface-2)] rounded-[4px] overflow-hidden flex items-center">
                              <div
                                className={shouldReduceMotion ? 'h-full rounded-[4px]' : 'h-full rounded-[4px] dv2-bar-animated'}
                                style={
                                  {
                                    width: `${pct}%`,
                                    backgroundColor: meta.color,
                                    '--bar-i': i,
                                  } as React.CSSProperties
                                }
                              />
                            </div>

                            <span className="w-12 text-right dv2-fig font-mono font-bold text-[13px] text-[var(--text)] shrink-0">
                              {d.count}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border-subtle)] mt-2">
                      <Label>Lowest Average Qualifying Position</Label>
                      <Label>Avg Grid</Label>
                    </div>

                    <div className="flex flex-col gap-2">
                      {insights.qualifying.topAvgQuali.map((d, i) => (
                        <div
                          key={d.driverId}
                          className="flex items-center justify-between text-[12px] py-1 border-b border-[var(--border-subtle)]/40 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 font-mono text-[var(--text-muted)]">{i + 1}.</span>
                            <TeamLogo
                              teamId={d.constructorId}
                              teamName=""
                              className="h-3 w-3 object-contain shrink-0"
                              showTeamNameNextToIt={false}
                            />
                            <span className="font-semibold text-[var(--text)]">
                              {d.givenName} {d.familyName}
                            </span>
                          </div>
                          <span className="dv2-fig font-mono font-bold text-[13px] text-[var(--text)]">
                            P{d.avgPosition.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. Teammates Tab */}
                {activeTab === 'teammates' && (
                  <motion.div
                    key="teammates"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col flex-1"
                  >
                    <div className="grid grid-cols-12 gap-2 pb-2 mb-3 border-b border-[var(--border-subtle)]">
                      <Label className="col-span-4">Team / Pair</Label>
                      <Label className="col-span-4 text-center">Qualifying H2H</Label>
                      <Label className="col-span-4 text-center">Race H2H</Label>
                    </div>

                    <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[310px] pr-1 dv2-scroll">
                      {insights.teammates.map((tm) => {
                        const meta = getTeamMeta(tm.constructorId)
                        const qTotal = tm.qualiH2H.total || 1
                        const q1Pct = (tm.qualiH2H.driver1Wins / qTotal) * 100
                        const q2Pct = (tm.qualiH2H.driver2Wins / qTotal) * 100

                        const rTotal = tm.raceH2H.total || 1
                        const r1Pct = (tm.raceH2H.driver1Wins / rTotal) * 100
                        const r2Pct = (tm.raceH2H.driver2Wins / rTotal) * 100

                        return (
                          <div
                            key={tm.constructorId}
                            className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-[var(--border-subtle)]/40 last:border-0"
                          >
                            {/* Team & Pair */}
                            <div className="col-span-4 flex items-center gap-2 min-w-0">
                              <TeamLogo
                                teamId={tm.constructorId}
                                teamName={tm.constructorName}
                                className="h-3.5 w-4 object-contain shrink-0"
                                showTeamNameNextToIt={false}
                              />
                              <span className="font-mono text-[12px] font-semibold text-[var(--text)] truncate">
                                {tm.driver1.code} / {tm.driver2.code}
                              </span>
                            </div>

                            {/* Quali Split Bar */}
                            <div className="col-span-4 flex flex-col items-center gap-1">
                              <div className="w-full h-2.5 bg-[var(--surface-2)] rounded-[2px] overflow-hidden flex">
                                <div
                                  style={{
                                    width: `${q1Pct}%`,
                                    backgroundColor: meta.color,
                                  }}
                                  className="h-full"
                                />
                                <div
                                  style={{
                                    width: `${q2Pct}%`,
                                    backgroundColor: 'var(--text-muted)',
                                    opacity: 0.5,
                                  }}
                                  className="h-full"
                                />
                              </div>
                              <span className="text-[11px] font-mono dv2-fig text-[var(--text-muted)]">
                                {tm.qualiH2H.driver1Wins} - {tm.qualiH2H.driver2Wins}
                              </span>
                            </div>

                            {/* Race Split Bar */}
                            <div className="col-span-4 flex flex-col items-center gap-1">
                              <div className="w-full h-2.5 bg-[var(--surface-2)] rounded-[2px] overflow-hidden flex">
                                <div
                                  style={{
                                    width: `${r1Pct}%`,
                                    backgroundColor: meta.color,
                                  }}
                                  className="h-full"
                                />
                                <div
                                  style={{
                                    width: `${r2Pct}%`,
                                    backgroundColor: 'var(--text-muted)',
                                    opacity: 0.5,
                                  }}
                                  className="h-full"
                                />
                              </div>
                              <span className="text-[11px] font-mono dv2-fig text-[var(--text-muted)]">
                                {tm.raceH2H.driver1Wins} - {tm.raceH2H.driver2Wins}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 4. Streaks Tab */}
                {activeTab === 'streaks' && (
                  <motion.div
                    key="streaks"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col flex-1"
                  >
                    <div className="mb-4">
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--border-subtle)]">
                        <Label>Consecutive Points Finishes</Label>
                        <Label>Races</Label>
                      </div>

                      <div className="flex flex-col gap-2">
                        {insights.streaks.pointsStreaks.map((s) => (
                          <div
                            key={s.driverId}
                            className="flex items-center justify-between p-2 rounded-[4px] bg-[var(--surface-2)]/40 border border-[var(--border-subtle)]/50"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <TeamLogo
                                teamId={s.constructorId}
                                teamName=""
                                className="h-3.5 w-4 object-contain shrink-0"
                                showTeamNameNextToIt={false}
                              />
                              <span className="font-mono font-bold text-[13px] text-[var(--text)]">
                                {s.code}
                              </span>
                              <span className="text-[12px] text-[var(--text-muted)] truncate hidden sm:inline">
                                {s.givenName} {s.familyName}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono font-bold text-[18px] text-[var(--text)] dv2-fig">
                                {s.streak}
                              </span>
                              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                                races
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--border-subtle)]">
                        <Label>Consecutive Classified Finishes</Label>
                        <Label>Races</Label>
                      </div>

                      <div className="flex flex-col gap-2">
                        {insights.streaks.classifiedStreaks.map((s) => (
                          <div
                            key={s.driverId}
                            className="flex items-center justify-between p-2 rounded-[4px] bg-[var(--surface-2)]/40 border border-[var(--border-subtle)]/50"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <TeamLogo
                                teamId={s.constructorId}
                                teamName=""
                                className="h-3.5 w-4 object-contain shrink-0"
                                showTeamNameNextToIt={false}
                              />
                              <span className="font-mono font-bold text-[13px] text-[var(--text)]">
                                {s.code}
                              </span>
                              <span className="text-[12px] text-[var(--text-muted)] truncate hidden sm:inline">
                                {s.givenName} {s.familyName}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono font-bold text-[18px] text-[var(--text)] dv2-fig">
                                {s.streak}
                              </span>
                              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                                races
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* 6. Grid Facts Strip (Always visible below insights, 2x2 on mobile, full width 4-col on desktop) */}
      {insights?.gridFacts && (
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Oldest Driver */}
            <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Oldest Driver
              </span>
              <div className="mt-2">
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[16px] text-[var(--text)] truncate">
                  {insights.gridFacts.oldestDriver?.code || '—'}
                </div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] dv2-fig mt-0.5">
                  {insights.gridFacts.oldestDriver
                    ? `${insights.gridFacts.oldestDriver.ageYears}y ${insights.gridFacts.oldestDriver.ageMonths}m`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Youngest Driver */}
            <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Youngest Driver
              </span>
              <div className="mt-2">
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[16px] text-[var(--text)] truncate">
                  {insights.gridFacts.youngestDriver?.code || '—'}
                </div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] dv2-fig mt-0.5">
                  {insights.gridFacts.youngestDriver
                    ? `${insights.gridFacts.youngestDriver.ageYears}y ${insights.gridFacts.youngestDriver.ageMonths}m`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Nationalities */}
            <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Nationalities
              </span>
              <div className="mt-2">
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[16px] text-[var(--text)]">
                  {insights.gridFacts.nationalitiesCount}
                </div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] mt-0.5">
                  Across 5 Continents
                </div>
              </div>
            </div>

            {/* Next Birthday */}
            <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Next Birthday
              </span>
              <div className="mt-2">
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[16px] text-[var(--text)] truncate">
                  {insights.gridFacts.nextBirthday?.code || '—'}
                </div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] dv2-fig mt-0.5">
                  {insights.gridFacts.nextBirthday
                    ? `${insights.gridFacts.nextBirthday.dateString} (Turning ${insights.gridFacts.nextBirthday.turningAge})`
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="mt-3 text-[11px] text-[var(--text-muted)]/70 font-mono">
            * Sprint race results are excluded from all season metrics.
          </div>
        </div>
      )}
    </section>
  )
}

export default DriversSection
