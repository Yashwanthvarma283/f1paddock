import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Figure, EmptyNote } from '@/features/dashboard-v2/primitives'
import { WeekendSection } from './WeekendSection'
import type { WeekendSession } from '@/api/types'
import type { RaceWeekendModel } from './types'
import { formatDateInTimezone, formatSessionType, formatTimeInTimezone, formatWeekdayInTimezone, getDateKey, getSessionState } from './utils'
import { useRenderCount } from './RenderTelemetry'

export function WeekendTimeline({ model }: { model: RaceWeekendModel }) {
  useRenderCount('timeline')
  const [now] = useState(() => new Date())
  const groups = useMemo(() => {
    const days = new Map<string, WeekendSession[]>()
    model.sessions.forEach(session => {
      const key = getDateKey(session.startTimeIso, model.selectedTimezone)
      days.set(key, [...(days.get(key) || []), session])
    })
    return Array.from(days.entries())
  }, [model.selectedTimezone, model.sessions])
  const next = model.sessions.find(s => getSessionState(s, now) === 'running')
    || model.sessions.find(s => getSessionState(s, now) === 'upcoming')

  return (
    <WeekendSection id="sessions" title="The weekend, session by session" action={<Figure className="rw-muted">{model.selectedTimezone.replaceAll('_', ' ')}</Figure>}>
      <p className="rw-intro">Start times in your selected timezone. Session windows use the schedule’s standard durations.</p>
      {groups.length ? <div className="rw-timeline">
        {groups.map(([key, sessions]) => <div key={key} className="rw-day-group">
          <h3 className="rw-day-heading"><span>{formatWeekdayInTimezone(sessions[0].startTimeIso, model.selectedTimezone)}</span>
            <Figure>{formatDateInTimezone(sessions[0].startTimeIso, model.selectedTimezone)}</Figure>
          </h3>
          <ol className="rw-session-list">
            {sessions.map(session => {
              const state = getSessionState(session, now)
              const label = state === 'running' ? 'Running now' : state === 'completed' ? 'Finished' : state === 'unknown' ? 'Time to be announced' : 'Scheduled'
              return <li key={session.id} className={`rw-session-row is-${state}${session.id === next?.id ? ' is-next' : ''}`}>
                <span className="rw-session-type dv2-fig">{session.type}</span>
                <div className="rw-session-main"><span className="rw-session-name">{formatSessionType(session.type)}</span><span className="rw-session-state">{label}</span></div>
                <Figure className="rw-session-time">{state === 'unknown' ? '—' : formatTimeInTimezone(session.startTimeIso, model.selectedTimezone, model.is24h)}</Figure>
                {state === 'completed' && session.type === 'RACE' && model.result?.results.length ?
                  <a href="#results" className="rw-session-result">Classification <ChevronRight size={14} aria-hidden="true" /></a> : null}
                {session.id === next?.id ? <span className="rw-playhead" aria-hidden="true" /> : null}
              </li>
            })}
          </ol>
        </div>)}
      </div> : <EmptyNote>No session times are available for this weekend.</EmptyNote>}
    </WeekendSection>
  )
}
