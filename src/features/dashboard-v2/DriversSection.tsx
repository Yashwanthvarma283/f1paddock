import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { getTeamMeta } from '@/lib/teams'
import { CountryFlag } from '@/lib/flags'
import { Section, SectionHeading, Figure } from './primitives'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { TeamLogo } from './TeamLogo'
import { DriverAvatar } from './DriverAvatar'
import { Trophy, Compass, Sparkles, Hash, ArrowRight, Award, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DriverFact {
  id: string
  driverId: string
  givenName: string
  familyName: string
  teamId: string
  teamName: string
  number: number
  country: string
  category: 'records' | 'trivia' | 'numbers'
  badge: string
  headline: string
  detail: string
  statHighlight: {
    label: string
    value: string
  }
}

const DRIVER_FACTS: DriverFact[] = [
  {
    id: 'hamilton-century',
    driverId: 'hamilton',
    givenName: 'Lewis',
    familyName: 'Hamilton',
    teamId: 'ferrari',
    teamName: 'Scuderia Ferrari',
    number: 44,
    country: 'United Kingdom',
    category: 'records',
    badge: 'The Century Club',
    headline: '104 Poles & 105 Victories',
    detail: 'The only driver in F1 history to surpass triple-digit race victories (105) and pole positions (104). He has won on 31 different circuits across the globe.',
    statHighlight: {
      label: 'Career Podiums',
      value: '201',
    },
  },
  {
    id: 'verstappen-streak',
    driverId: 'max_verstappen',
    givenName: 'Max',
    familyName: 'Verstappen',
    teamId: 'red_bull',
    teamName: 'Oracle Red Bull Racing',
    number: 1,
    country: 'Netherlands',
    category: 'records',
    badge: 'All-Time Streak',
    headline: '10 Consecutive Grand Prix Wins',
    detail: 'Holds the greatest winning streak in F1 history with 10 consecutive Grand Prix victories in 2023, along with an unprecedented 86.4% single-season win rate.',
    statHighlight: {
      label: 'Career Victories',
      value: '63',
    },
  },
  {
    id: 'alonso-longevity',
    driverId: 'alonso',
    givenName: 'Fernando',
    familyName: 'Alonso',
    teamId: 'aston_martin',
    teamName: 'Aston Martin Aramco',
    number: 14,
    country: 'Spain',
    category: 'records',
    badge: 'Four Decades',
    headline: '400+ Grands Prix Across 24 Years',
    detail: 'The only driver to race across V10, V8, V6 Turbo-Hybrid, and Ground Effect eras. His career started in 2001 before several active grid drivers were even born.',
    statHighlight: {
      label: 'Race Starts',
      value: '400+',
    },
  },
  {
    id: 'leclerc-monaco',
    driverId: 'leclerc',
    givenName: 'Charles',
    familyName: 'Leclerc',
    teamId: 'ferrari',
    teamName: 'Scuderia Ferrari',
    number: 16,
    country: 'Monaco',
    category: 'trivia',
    badge: 'Breakthrough',
    headline: '93-Year Monaco Curse Broken',
    detail: 'Conquered years of home-race heartbreak in 2024 to become the first Monegasque driver to win the Monaco Grand Prix since Louis Chiron in 1931.',
    statHighlight: {
      label: 'Career Poles',
      value: '26',
    },
  },
  {
    id: 'norris-number',
    driverId: 'norris',
    givenName: 'Lando',
    familyName: 'Norris',
    teamId: 'mclaren',
    teamName: 'McLaren Formula 1 Team',
    number: 4,
    country: 'United Kingdom',
    category: 'numbers',
    badge: 'Number Origin',
    headline: 'The LN4 Identity & Rossi Homage',
    detail: 'Chose #4 because it integrates into his personal "LN4" monogram and mirrors MotoGP legend Valentino Rossi’s #46, whom Lando idolized growing up.',
    statHighlight: {
      label: 'McLaren Starts',
      value: '125+',
    },
  },
  {
    id: 'piastri-triple',
    driverId: 'piastri',
    givenName: 'Oscar',
    familyName: 'Piastri',
    teamId: 'mclaren',
    teamName: 'McLaren Formula 1 Team',
    number: 81,
    country: 'Australia',
    category: 'records',
    badge: 'Triple Crown',
    headline: '3 Successive Rookie Titles',
    detail: 'One of only three drivers in history (with Leclerc and Russell) to win Formula Renault, F3, and F2 in consecutive rookie campaigns.',
    statHighlight: {
      label: 'Junior Titles',
      value: '3 in 3 yrs',
    },
  },
  {
    id: 'russell-saturday',
    driverId: 'russell',
    givenName: 'George',
    familyName: 'Russell',
    teamId: 'mercedes',
    teamName: 'Mercedes-AMG PETRONAS',
    number: 63,
    country: 'United Kingdom',
    category: 'trivia',
    badge: 'Mr. Saturday',
    headline: '37–0 Teammate Quali Streak',
    detail: 'Earned his nickname "Mr. Saturday" after defeating his teammate in 37 consecutive race qualifying sessions during his formative seasons at Williams.',
    statHighlight: {
      label: 'Qualifying Record',
      value: '37-0 at Williams',
    },
  },
  {
    id: 'sainz-drs',
    driverId: 'sainz',
    givenName: 'Carlos',
    familyName: 'Sainz',
    teamId: 'williams',
    teamName: 'Williams Racing',
    number: 55,
    country: 'Spain',
    category: 'trivia',
    badge: 'Tactical Genius',
    headline: 'Singapore 2023 DRS Masterclass',
    detail: 'Ended Red Bull’s clean sweep in 2023 by deliberately giving DRS to former teammate Lando Norris behind him, creating an impenetrable defensive train.',
    statHighlight: {
      label: 'Tactical Wins',
      value: 'Singapore ‘23',
    },
  },
  {
    id: 'hulkenberg-lemans',
    driverId: 'hulkenberg',
    givenName: 'Nico',
    familyName: 'Hülkenberg',
    teamId: 'sauber',
    teamName: 'Stake F1 Team Kick Sauber',
    number: 27,
    country: 'Germany',
    category: 'trivia',
    badge: 'Endurance King',
    headline: '24 Hours of Le Mans Winner',
    detail: 'Won the overall 24 Hours of Le Mans with Porsche on his very first attempt in 2015, becoming the first active F1 driver to do so since 1991.',
    statHighlight: {
      label: 'Le Mans Debut',
      value: '1st Overall',
    },
  },
  {
    id: 'tsunoda-double',
    driverId: 'tsunoda',
    givenName: 'Yuki',
    familyName: 'Tsunoda',
    teamId: 'rb',
    teamName: 'Visa Cash App RB',
    number: 22,
    country: 'Japan',
    category: 'numbers',
    badge: 'Number Origin',
    headline: 'Doubling the Karting Roots',
    detail: 'Raced #11 in his karting days in Japan. When he entered Formula 1 and #11 was already claimed by Sergio Perez, he simply doubled it to #22.',
    statHighlight: {
      label: 'Road to F1',
      value: '2 Seasons',
    },
  },
  {
    id: 'albon-jordan',
    driverId: 'albon',
    givenName: 'Alexander',
    familyName: 'Albon',
    teamId: 'williams',
    teamName: 'Williams Racing',
    number: 23,
    country: 'Thailand',
    category: 'numbers',
    badge: 'Number Origin',
    headline: 'Tribute to Michael Jordan',
    detail: 'Raced under #46 for Valentino Rossi in childhood karting, then switched to #23 as an homage to basketball icon Michael Jordan when moving to single-seaters.',
    statHighlight: {
      label: 'Williams Starts',
      value: '60+',
    },
  },
  {
    id: 'bearman-debut',
    driverId: 'bearman',
    givenName: 'Oliver',
    familyName: 'Bearman',
    teamId: 'haas',
    teamName: 'MoneyGram Haas F1 Team',
    number: 87,
    country: 'United Kingdom',
    category: 'records',
    badge: 'Sensational Debut',
    headline: 'Points on F1 Debut at 18',
    detail: 'Drafted in with mere hours of notice to replace Carlos Sainz at Ferrari in Jeddah 2024, qualifying P11 and surging to P7 for world championship points on debut.',
    statHighlight: {
      label: 'Debut Finish',
      value: 'P7 & Points',
    },
  },
]

const MACRO_STATS = [
  {
    label: 'World Championships',
    value: '13',
    sub: 'Hamilton (7), Verstappen (4), Alonso (2)',
    icon: Trophy,
  },
  {
    label: 'All-Time Starts Record',
    value: '400+',
    sub: 'Held by Fernando Alonso (2001–Present)',
    icon: Award,
  },
  {
    label: 'Grid Age Span',
    value: '25 Yrs',
    sub: 'From 18y rookies to 43y veteran Alonso',
    icon: Zap,
  },
  {
    label: 'Global Nationalities',
    value: '14',
    sub: 'Representing 5 continents worldwide',
    icon: Compass,
  },
]

type FilterCategory = 'all' | 'records' | 'numbers' | 'trivia'

const FILTER_TABS: { key: FilterCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'all', label: 'All Insights', icon: Sparkles },
  { key: 'records', label: 'Records & Milestones', icon: Trophy },
  { key: 'numbers', label: 'Number Origins', icon: Hash },
  { key: 'trivia', label: 'Behind the Helmet', icon: Award },
]

export const DriversSection: React.FC<{ id?: string }> = ({ id }) => {
  const [activeTab, setActiveTab] = useState<FilterCategory>('all')
  const shouldReduceMotion = useReducedMotion()

  const filteredFacts = DRIVER_FACTS.filter(
    (f) => activeTab === 'all' || f.category === activeTab
  )

  return (
    <Section id={id || 'drivers'}>
      <SectionHeading subtitle="Grid Intel & Facts">
        Driver Intelligence
      </SectionHeading>

      {/* 1. Macro Grid Statistics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8">
        {MACRO_STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex flex-col p-4 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] relative overflow-hidden group hover:border-[var(--border)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)]">
                  {stat.label}
                </span>
                <Icon className="w-4 h-4 text-[var(--accent)] opacity-80" />
              </div>
              <div className="font-[family-name:var(--font-display)] font-extrabold text-[24px] sm:text-[28px] text-[var(--text)] tracking-tight leading-none dv2-fig">
                {stat.value}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-snug truncate">
                {stat.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* 2. Filter Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-8 mb-6 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer outline-none border',
                  isActive
                    ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-xs'
                    : 'bg-[var(--surface-1)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text)] hover:border-[var(--border)]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                    isActive
                      ? 'bg-[var(--bg)] text-[var(--text)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  )}
                >
                  {tab.key === 'all'
                    ? DRIVER_FACTS.length
                    : DRIVER_FACTS.filter((f) => f.category === tab.key).length}
                </span>
              </button>
            )
          })}
        </div>

        <Link
          to="/drivers"
          className="text-[12px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 ml-auto"
        >
          <span>Full grid roster</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3. Driver Fact Cards Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredFacts.map((fact, idx) => {
            const teamMeta = getTeamMeta(fact.teamId)

            return (
              <motion.div
                key={fact.id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="flex flex-col bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[4px] p-5 relative overflow-hidden hover:border-[var(--border)] transition-colors group shadow-xs"
              >
                {/* Team livery accent bar on left */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: teamMeta.color }}
                />

                {/* Card Header: Avatar, Driver Name, Country Flag, Team, Number */}
                <div className="flex items-start justify-between gap-3 mb-3.5 pl-1.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <DriverAvatar
                      driverId={fact.driverId}
                      givenName={fact.givenName}
                      familyName={fact.familyName}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover shrink-0 bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                      fallbackClassName="w-11 h-11 text-[11px]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[15px] uppercase tracking-tight text-[var(--text)] leading-tight truncate">
                          <span className="font-normal text-[var(--text-muted)] lowercase capitalize mr-1">
                            {fact.givenName}
                          </span>
                          {fact.familyName}
                        </span>
                        <CountryFlag
                          country={fact.country}
                          className="w-3.5 h-3.5 rounded-[2px] shrink-0"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <TeamLogo
                          teamId={teamMeta.id}
                          teamName={teamMeta.name}
                          className="h-3 w-3.5 object-contain shrink-0"
                          showTeamNameNextToIt={false}
                        />
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          {teamMeta.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permanent Number Badge */}
                  <div className="shrink-0 flex items-center gap-0.5 px-2 py-0.5 bg-[var(--surface-2)] rounded-[3px] border border-[var(--border-subtle)] text-[12px] font-bold text-[var(--text)] font-mono">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-normal mr-0.5">
                      #
                    </span>
                    <Figure>{fact.number}</Figure>
                  </div>
                </div>

                {/* Card Body: Category Badge, Headline & Story */}
                <div className="flex-1 flex flex-col pl-1.5 mt-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-[var(--accent)] mb-1">
                    {fact.badge}
                  </span>
                  <h4 className="font-[family-name:var(--font-display)] font-bold text-[16px] text-[var(--text)] leading-snug tracking-tight">
                    {fact.headline}
                  </h4>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-2 line-clamp-3 group-hover:line-clamp-none transition-all">
                    {fact.detail}
                  </p>
                </div>

                {/* Card Footer: Stat Highlight */}
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between pl-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                    {fact.statHighlight.label}
                  </span>
                  <span className="text-[13px] font-bold text-[var(--accent)] dv2-fig font-mono">
                    {fact.statHighlight.value}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* 4. Bottom Roster CTA Bar */}
      <div className="mt-8 p-4 sm:p-5 rounded-[4px] bg-[var(--surface-1)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-[14px] text-[var(--text)]">
            Explore All 20 Grid Competitors & Championship Standings
          </div>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            View full career biographies, teammate head-to-head comparisons, and real-time points.
          </p>
        </div>
        <Link
          to="/drivers"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--text)] text-[var(--bg)] font-semibold text-[13px] hover:opacity-90 transition-opacity"
        >
          <span>View Grid Roster</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Section>
  )
}

export default DriversSection
