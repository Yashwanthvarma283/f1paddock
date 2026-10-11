import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useConstructorStandings,
  useDriverStandings,
  useLastRaceResult,
  useSchedule,
} from '@/api/useF1Data'
import { jolpicaClient } from '@/api/jolpicaClient'
import { SessionService } from '@/api/sessionService'
import { useTimezone } from '@/context/TimezoneContext'
import { resolveCircuit, getWeekendState, buildSessions } from './utils'

export function useRaceWeekend(roundParam?: string) {
  const timezone = useTimezone()
  const scheduleQuery = useSchedule()
  const season = scheduleQuery.data?.season ?? 'current'
  const driverQuery = useDriverStandings(season)
  const constructorQuery = useConstructorStandings(season)
  const lastResultQuery = useLastRaceResult()

  const race = useMemo(() => {
    const races = scheduleQuery.data?.races ?? []
    if (!roundParam) return SessionService.findNextRace(races)
    return races.find((item) => String(item.round) === roundParam) ?? null
  }, [roundParam, scheduleQuery.data?.races])

  const sessions = useMemo(
    () => (race ? buildSessions(race) : []),
    [race]
  )

  const matchingLatestResult = useMemo(() => {
    const result = lastResultQuery.data
    if (!result || !race) return null
    return result.season === season && result.round === race.round ? result : null
  }, [lastResultQuery.data, race, season])

  const selectedResultQuery = useQuery({
    queryKey: ['race-weekend-result', season, race?.round],
    queryFn: () => jolpicaClient.getRaceResults(season, race?.round ?? ''),
    enabled: Boolean(race && getWeekendState(sessions) === 'completed' && !lastResultQuery.isPending && !matchingLatestResult),
    staleTime: 1000 * 60 * 15,
  })

  const result = useMemo(() => {
    if (matchingLatestResult) {
      return {
        season: matchingLatestResult.season,
        round: matchingLatestResult.round,
        raceName: matchingLatestResult.raceName,
        results: matchingLatestResult.results,
        fastestLap: matchingLatestResult.fastestLap,
      }
    }

    const selected = selectedResultQuery.data
    if (!selected || !race || selected.season !== season || selected.round !== race.round) return null

    const fastestLap = selected.Results.find((item) => item.FastestLap?.rank === '1')
    return {
      season: selected.season,
      round: selected.round,
      raceName: selected.raceName,
      results: selected.Results,
      fastestLap,
    }
  }, [matchingLatestResult, race, season, selectedResultQuery.data])

  const model = useMemo(() => {
    if (!race) return null
    return {
      race,
      year: season,
      sessions,
      circuit: resolveCircuit(race),
      weekendState: getWeekendState(sessions),
      selectedTimezone: timezone.timezone,
      is24h: timezone.is24h,
      drivers: driverQuery.data ?? [],
      constructors: constructorQuery.data ?? [],
      result,
    }
  }, [constructorQuery.data, driverQuery.data, race, result, season, sessions, timezone.timezone, timezone.is24h])

  return {
    model,
    isLoading: scheduleQuery.isLoading,
    isError: scheduleQuery.isError,
    error: scheduleQuery.error,
    refetch: scheduleQuery.refetch,
    standingsLoading: driverQuery.isLoading || constructorQuery.isLoading,
    standingsError: driverQuery.isError || constructorQuery.isError,
    retryStandings: () => { void driverQuery.refetch(); void constructorQuery.refetch() },
    resultLoading: selectedResultQuery.isLoading || lastResultQuery.isLoading,
    resultError: selectedResultQuery.isError || lastResultQuery.isError,
  }
}
