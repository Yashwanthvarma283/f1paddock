import { useQuery } from '@tanstack/react-query'
import { jolpicaClient } from './jolpicaClient'
import { openf1Client } from './openf1Client'

export const QUERY_KEYS = {
  schedule: (season: string) => ['f1', 'schedule', season] as const,
  lastResult: () => ['f1', 'lastResult'] as const,
  driverStandings: (season: string) => ['f1', 'driverStandings', season] as const,
  constructorStandings: (season: string) => ['f1', 'constructorStandings', season] as const,
  seasons: () => ['f1', 'seasons'] as const,
  liveStatus: (circuit?: string, country?: string) => ['f1', 'liveStatus', circuit, country] as const,
  circuitPreviousEdition: (circuitId?: string, season?: number | string) => ['f1', 'circuitPreviousEdition', circuitId, season] as const,
}

export function useSchedule(season: string = 'current') {
  return useQuery({
    queryKey: QUERY_KEYS.schedule(season),
    queryFn: () => jolpicaClient.getSchedule(season),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every minute for schedule updates
  })
}

export function useLastRaceResult() {
  return useQuery({
    queryKey: QUERY_KEYS.lastResult(),
    queryFn: () => jolpicaClient.getLastRaceResult(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll every 30s so race completion is detected in real time
  })
}

export function useDriverStandings(season: string = 'current') {
  return useQuery({
    queryKey: QUERY_KEYS.driverStandings(season),
    queryFn: () => jolpicaClient.getDriverStandings(season),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll every 30s for real-time standings after GP
  })
}

export function useConstructorStandings(season: string = 'current') {
  return useQuery({
    queryKey: QUERY_KEYS.constructorStandings(season),
    queryFn: () => jolpicaClient.getConstructorStandings(season),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every minute
  })
}

export function useAvailableSeasons() {
  return useQuery({
    queryKey: QUERY_KEYS.seasons(),
    queryFn: () => jolpicaClient.getSeasons(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

export function useLiveStatus(circuitName?: string, countryName?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.liveStatus(circuitName, countryName),
    queryFn: () => openf1Client.checkSessionStatus(circuitName, countryName),
    refetchInterval: 1000 * 60, // Poll every minute for live status updates
    staleTime: 1000 * 30,
  })
}

export function useCircuitPreviousEdition(circuitId?: string, currentSeason?: number | string) {
  return useQuery({
    queryKey: QUERY_KEYS.circuitPreviousEdition(circuitId, currentSeason),
    queryFn: () => (circuitId ? jolpicaClient.getCircuitPreviousEdition(circuitId, currentSeason) : null),
    enabled: Boolean(circuitId),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

export { useSeasonInsights } from './useSeasonInsights'

