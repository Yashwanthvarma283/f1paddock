import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '@/features/dashboard-v2/Header'
import { Footer } from '@/features/dashboard-v2/Footer'
import { RacingLine, QuietError, EmptyNote } from '@/features/dashboard-v2/primitives'
import { WeekendHero } from '@/features/raceweekend-v2/WeekendHero'
import { WeekendNav } from '@/features/raceweekend-v2/WeekendNav'
import { WeekendTimeline } from '@/features/raceweekend-v2/WeekendTimeline'
import { CircuitExplorer } from '@/features/raceweekend-v2/CircuitExplorer'
import { ChampionshipContext } from '@/features/raceweekend-v2/ChampionshipContext'
import { WeekendResults } from '@/features/raceweekend-v2/WeekendResults'
import { RaceWeekendSkeleton } from '@/features/raceweekend-v2/RaceWeekendSkeleton'
import { useRaceWeekend } from '@/features/raceweekend-v2/useRaceWeekend'
import '@/features/dashboard-v2/dashboard-v2.css'
import '@/features/raceweekend-v2/raceweekend-v2.css'

const RacingLineBreak: React.FC = () => (
  <div className="w-full flex my-5 md:my-7 lg:my-9" aria-hidden="true">
    <RacingLine className="h-[16px] md:h-[24px] opacity-100" />
  </div>
)

export const RaceWeekendPage: React.FC = () => {
  const { round } = useParams<{ round?: string }>()
  const { model, isLoading, isError, error, refetch, standingsLoading, standingsError, resultLoading } = useRaceWeekend(round)
  const mainRef = useRef<HTMLElement>(null)
  const modelRound = model?.race.round

  useEffect(() => {
    performance.mark('raceweekend-route-mounted')
    const frame = window.requestAnimationFrame(() => {
      performance.mark('raceweekend-first-frame')
      performance.measure('raceweekend-route-to-first-frame', 'raceweekend-route-mounted', 'raceweekend-first-frame')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!modelRound) return
    mainRef.current?.focus({ preventScroll: true })
    performance.mark('raceweekend-data-ready')
    if (performance.getEntriesByName('raceweekend-route-mounted').length > 0) {
      performance.measure('raceweekend-data-to-page', 'raceweekend-route-mounted', 'raceweekend-data-ready')
    }
  }, [modelRound])

  if (isLoading) return <RaceWeekendSkeleton />

  return (
    <div data-dv2 data-rw className="rw-page">
      <Header />
      <main ref={mainRef} tabIndex={-1} className="rw-main" id="main-content">
        {isError ? (
          <div className="rw-container rw-page-state">
            <QuietError message={error instanceof Error ? error.message : 'The race weekend could not be loaded.'} onRetry={() => refetch()} />
          </div>
        ) : !model ? (
          <div className="rw-container rw-page-state">
            <EmptyNote>No race weekend matches this round.</EmptyNote>
          </div>
        ) : (
          <>
            <WeekendHero model={model} />
            <WeekendNav model={model} showResults={model.weekendState === 'completed'} />
            <RacingLineBreak />
            <div className="rw-container">
              <WeekendTimeline model={model} />
            </div>
            <RacingLineBreak />
            <div className="rw-container">
              <CircuitExplorer circuit={model.circuit} />
            </div>
            <RacingLineBreak />
            <div className="rw-container">
              <ChampionshipContext model={model} isLoading={standingsLoading} isError={standingsError} />
            </div>
            {model.weekendState === 'completed' ? (
              <>
                <RacingLineBreak />
                <div className="rw-container">
                  {resultLoading ? <div className="rw-result-loading skeleton-shimmer" aria-label="Loading classification" /> : <WeekendResults model={model} />}
                </div>
              </>
            ) : null}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default RaceWeekendPage
