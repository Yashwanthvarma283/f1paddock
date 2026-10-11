import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { CountryFlag } from '@/lib/flags'
import { getTeamMeta } from '@/lib/teams'
import { DriverAvatar } from '@/features/dashboard-v2/DriverAvatar'
import { TeamLogo } from '@/features/dashboard-v2/TeamLogo'
import { Figure, Label, QuietError, EmptyNote } from '@/features/dashboard-v2/primitives'
import type { ConstructorStandingItem, DriverStandingItem } from '@/api/types'
import type { RaceWeekendModel } from './types'
import { WeekendSection } from './WeekendSection'

interface ChampionshipContextProps {
  model: RaceWeekendModel
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
}

const DriverRow: React.FC<{ item: DriverStandingItem; leaderPoints: number; index: number }> = ({ item, leaderPoints, index }) => {
  const team = getTeamMeta(item.constructor.constructorId)
  const percentage = leaderPoints > 0 ? item.points / leaderPoints : 0
  return (
    <div className="rw-standings-row">
      <Figure className="rw-standing-position">{String(item.position).padStart(2, '0')}</Figure>
      <DriverAvatar
        driverId={item.driver.driverId}
        code={item.driver.code}
        givenName={item.driver.givenName}
        familyName={item.driver.familyName}
        className="rw-driver-avatar"
        fallbackClassName="rw-driver-avatar rw-driver-fallback"
      />
      <div className="rw-standing-name">
        <strong>{item.driver.givenName} <span>{item.driver.familyName}</span></strong>
        <span className="rw-standing-team">
          <TeamLogo teamId={team.id} teamName={team.name} className="h-4 w-5 object-contain" showTeamNameNextToIt={false} />
          {item.constructor.name}
        </span>
      </div>
      <div className="rw-standing-bar" aria-hidden="true">
        <motion.span
          initial={{ transform: 'scaleX(0)' }}
          animate={{ transform: `scaleX(${percentage})` }}
          transition={{ duration: 0.55, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
          style={{ backgroundColor: team.color }}
        />
      </div>
      <Figure className="rw-standing-points">{item.points}</Figure>
    </div>
  )
}

const ConstructorRow: React.FC<{ item: ConstructorStandingItem; leaderPoints: number; index: number }> = ({ item, leaderPoints, index }) => {
  const team = getTeamMeta(item.constructor.constructorId)
  const percentage = leaderPoints > 0 ? item.points / leaderPoints : 0
  return (
    <div className="rw-standings-row">
      <Figure className="rw-standing-position">{String(item.position).padStart(2, '0')}</Figure>
      <div className="rw-team-logo-wrap">
        <TeamLogo teamId={team.id} teamName={team.name} className="h-6 w-8 object-contain" showTeamNameNextToIt={false} />
      </div>
      <div className="rw-standing-name">
        <strong>{item.constructor.name}</strong>
        <span className="rw-standing-team"><CountryFlag country={item.constructor.nationality} className="h-3.5 w-5 rounded-[2px]" /> {item.wins} wins</span>
      </div>
      <div className="rw-standing-bar" aria-hidden="true">
        <motion.span
          initial={{ transform: 'scaleX(0)' }}
          animate={{ transform: `scaleX(${percentage})` }}
          transition={{ duration: 0.55, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
          style={{ backgroundColor: team.color }}
        />
      </div>
      <Figure className="rw-standing-points">{item.points}</Figure>
    </div>
  )
}

export const ChampionshipContext: React.FC<ChampionshipContextProps> = ({ model, isLoading, isError, onRetry }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTab = searchParams.get('tab') === 'constructors' ? 'constructors' : 'drivers'
  const reduceMotion = useReducedMotion()
  const drivers = model.drivers.slice(0, 5)
  const constructors = model.constructors.slice(0, 3)
  const driverLeader = drivers[0]?.points ?? 0
  const constructorLeader = constructors[0]?.points ?? 0

  const setTab = (tab: 'drivers' | 'constructors') => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  return (
    <WeekendSection id="championship" title="Who is winning" action={<Link to={selectedTab === 'drivers' ? '/drivers' : '/teams'} className="rw-secondary-link dv2-link">View full standings <span aria-hidden="true">→</span></Link>}>
      <div className="rw-tab-bar" role="tablist" aria-label="Championship standings">
        {(['drivers', 'constructors'] as const).map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={selectedTab === tab} onClick={() => setTab(tab)} className={`rw-tab${selectedTab === tab ? ' is-active' : ''}`}>
            {selectedTab === tab ? <motion.span layoutId="rw-standings-indicator" className="rw-tab-indicator" aria-hidden="true" /> : null}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rw-standings-skeleton" aria-label="Loading championship standings">
          {Array.from({ length: 5 }).map((_, index) => <div key={index} className="skeleton-shimmer h-14 rounded-[4px]" />)}
        </div>
      ) : isError ? (
        <QuietError message="Championship standings could not be loaded." onRetry={onRetry} />
      ) : selectedTab === 'drivers' ? (
        drivers.length > 0 ? (
          <div className={`rw-standings-list${reduceMotion ? ' is-static' : ''}`} role="tabpanel">
            <div className="rw-standings-head"><Label>Pos</Label><Label>Driver</Label><Label className="rw-standings-head-points">Points</Label></div>
            {drivers.map((item, index) => <DriverRow key={item.driver.driverId} item={item} leaderPoints={driverLeader} index={index} />)}
          </div>
        ) : <EmptyNote>No driver standings are available.</EmptyNote>
      ) : (
        constructors.length > 0 ? (
          <div className={`rw-standings-list${reduceMotion ? ' is-static' : ''}`} role="tabpanel">
            <div className="rw-standings-head"><Label>Pos</Label><Label>Constructor</Label><Label className="rw-standings-head-points">Points</Label></div>
            {constructors.map((item, index) => <ConstructorRow key={item.constructor.constructorId} item={item} leaderPoints={constructorLeader} index={index} />)}
          </div>
        ) : <EmptyNote>No constructor standings are available.</EmptyNote>
      )}
    </WeekendSection>
  )
}
