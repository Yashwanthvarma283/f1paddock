import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { getTeamMeta } from '@/lib/teams'
import { DriverAvatar } from '@/features/dashboard-v2/DriverAvatar'
import { TeamLogo } from '@/features/dashboard-v2/TeamLogo'
import { Figure, Label, EmptyNote } from '@/features/dashboard-v2/primitives'
import type { F1ResultItem } from '@/api/types'
import type { RaceWeekendModel } from './types'
import { WeekendSection } from './WeekendSection'

interface WeekendResultsProps {
  model: RaceWeekendModel
}

const ResultDriver: React.FC<{ item: F1ResultItem }> = ({ item }) => (
  <div className="rw-result-driver">
    <DriverAvatar
      driverId={item.Driver.driverId}
      code={item.Driver.code}
      givenName={item.Driver.givenName}
      familyName={item.Driver.familyName}
      className="rw-result-avatar"
      fallbackClassName="rw-result-avatar rw-driver-fallback"
    />
    <div className="min-w-0">
      <strong>{item.Driver.givenName} <span>{item.Driver.familyName}</span></strong>
      <span>{item.Constructor.name}</span>
    </div>
  </div>
)

const PodiumSpot: React.FC<{ item: F1ResultItem; place: 1 | 2 | 3 }> = ({ item, place }) => {
  const team = getTeamMeta(item.Constructor.constructorId)
  return (
    <div className={`rw-podium-spot place-${place}`}>
      <DriverAvatar
        driverId={item.Driver.driverId}
        code={item.Driver.code}
        givenName={item.Driver.givenName}
        familyName={item.Driver.familyName}
        className="rw-podium-avatar"
        fallbackClassName="rw-podium-avatar rw-driver-fallback"
      />
      <div className="rw-podium-name">
        <span>{item.Driver.givenName}</span>
        <strong>{item.Driver.familyName}</strong>
      </div>
      <TeamLogo teamId={team.id} teamName={team.name} className="h-5 w-7 object-contain" showTeamNameNextToIt={false} />
      <Figure className="rw-podium-time">{item.Time?.time ?? item.status ?? '—'}</Figure>
      <motion.div className="rw-podium-bar" initial={{ transform: 'scaleY(0)' }} animate={{ transform: 'scaleY(1)' }} transition={{ duration: 0.45, delay: place * 0.05 }} style={{ backgroundColor: team.color }} />
      <Figure className="rw-podium-place">{place}</Figure>
    </div>
  )
}

export const WeekendResults: React.FC<WeekendResultsProps> = ({ model }) => {
  const [expanded, setExpanded] = useState(true)
  const result = model.result
  const podium = result?.results.filter((item) => ['1', '2', '3'].includes(item.position)).sort((a, b) => Number(a.position) - Number(b.position)) ?? []
  const rest = result?.results.filter((item) => Number(item.position) >= 4 && Number(item.position) <= 10) ?? []
  const totalLaps = useMemo(() => {
    const values = result?.results.map((item) => Number(item.laps)).filter(Number.isFinite) ?? []
    return values.length > 0 ? Math.max(...values) : null
  }, [result?.results])
  const fastestLap = result?.fastestLap ?? result?.results.find((item) => item.FastestLap?.rank === '1')

  return (
    <WeekendSection id="results" title="Classification">
      {!result || result.results.length === 0 ? (
        <EmptyNote>Classification is not available for this weekend.</EmptyNote>
      ) : (
        <>
          <div className="rw-result-summary">
            <div className="rw-podium">
              {([2, 1, 3] as const).map((place) => {
                const item = podium.find((entry) => Number(entry.position) === place)
                return item ? <PodiumSpot key={place} item={item} place={place} /> : null
              })}
            </div>
            <div className="rw-result-facts">
              <div><Label>Fastest lap</Label><Figure>{fastestLap?.Driver.code ?? fastestLap?.Driver.familyName ?? '—'}{fastestLap?.FastestLap?.Time.time ? ` · ${fastestLap.FastestLap.Time.time}` : ''}</Figure></div>
              <div><Label>Total laps</Label><Figure>{totalLaps ?? '—'}</Figure></div>
            </div>
          </div>
          <div className={`rw-classification-shell${expanded ? ' is-expanded' : ''}`}>
            <button type="button" className="rw-disclosure-button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              <span><Trophy className="h-4 w-4" aria-hidden="true" /> P4–P10</span>
              {expanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            </button>
            <div className="rw-classification-rows" aria-hidden={!expanded}>
              {rest.map((item) => {
                const team = getTeamMeta(item.Constructor.constructorId)
                return (
                  <div key={item.Driver.driverId} className="rw-classification-row">
                    <Figure>{item.position}</Figure>
                    <ResultDriver item={item} />
                    <TeamLogo teamId={team.id} teamName={team.name} className="h-4 w-6 object-contain" showTeamNameNextToIt={false} />
                    <Figure>{item.Time?.time ?? item.status ?? '—'}</Figure>
                    <Figure>{item.points}</Figure>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </WeekendSection>
  )
}
