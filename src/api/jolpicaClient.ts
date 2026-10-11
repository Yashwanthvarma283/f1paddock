import {
  F1Race,
  F1ResultItem,
  LastRaceResultPayload,
  DriverStandingItem,
  ConstructorStandingItem,
  RaceResultPayload,
} from './types'
import { sanitizeRaceName } from '../lib/circuits'

const BASE_URL = 'https://api.jolpi.ca/ergast/f1'

/**
 * HTTP Client for the Jolpica-F1 Ergast API.
 * Adheres to SRP: exactly one responsibility of executing and parsing Jolpica API calls.
 */
class JolpicaClient {
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Jolpica API error: ${response.status} ${response.statusText}`)
      }

      return (await response.json()) as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Fetches the race schedule for the current or specified season.
   */
  async getSchedule(season: string = 'current'): Promise<{ season: string; races: F1Race[] }> {
    const data = await this.request<any>(`/${season}.json`)
    const raceTable = data?.MRData?.RaceTable
    const rawRaces: F1Race[] = raceTable?.Races || []
    const races: F1Race[] = rawRaces.map((r) => ({
      ...r,
      raceName: sanitizeRaceName(r.raceName, r.Circuit?.circuitId, r.Circuit?.Location?.country),
    }))
    return {
      season: raceTable?.season || season,
      races,
    }
  }

  /**
   * Fetches official race classification for a specific season and round.
   */
  async getRaceResults(season: string | number, round: string | number): Promise<RaceResultPayload | null> {
    try {
      const data = await this.request<any>(`/${season}/${round}/results.json`)
      const race = data?.MRData?.RaceTable?.Races?.[0]
      return race || null
    } catch {
      return null
    }
  }

  /**
   * Fetches official qualifying classification for a specific season and round.
   */
  async getQualifyingResults(season: string | number, round: string | number): Promise<any | null> {
    try {
      const data = await this.request<any>(`/${season}/${round}/qualifying.json`)
      const race = data?.MRData?.RaceTable?.Races?.[0]
      return race || null
    } catch {
      return null
    }
  }

  /**
   * Fetches official pit stops for a specific season and round (available from 2012).
   */
  async getPitStops(season: string | number, round: string | number): Promise<any[]> {
    try {
      const data = await this.request<any>(`/${season}/${round}/pitstops.json?limit=100`)
      return data?.MRData?.RaceTable?.Races?.[0]?.PitStops || []
    } catch {
      return []
    }
  }

  /**
   * Fetches the last completed race results.
   */
  async getLastRaceResult(): Promise<LastRaceResultPayload | null> {
    const data = await this.request<any>('/current/last/results.json')
    const race = data?.MRData?.RaceTable?.Races?.[0]
    if (!race) return null

    const rawResults: F1ResultItem[] = race.Results || []
    const winner = rawResults.find((r) => r.position === '1') || rawResults[0]
    const podium = rawResults.slice(0, 3)

    // Find driver with fastest lap rank = 1
    const fastestLap = rawResults.find((r) => r.FastestLap?.rank === '1')

    return {
      season: race.season,
      round: race.round,
      raceName: sanitizeRaceName(race.raceName, race.Circuit?.circuitId, race.Circuit?.Location?.country),
      Circuit: race.Circuit,
      date: race.date,
      time: race.time,
      results: rawResults,
      winner,
      podium,
      fastestLap,
    }
  }

  /**
   * Fetches top driver standings with computed leader gaps.
   */
  async getDriverStandings(season: string = 'current'): Promise<DriverStandingItem[]> {
    const data = await this.request<any>(`/${season}/driverStandings.json`)
    const lists = data?.MRData?.StandingsTable?.StandingsLists?.[0]
    const rawStandings = lists?.DriverStandings || []

    const leaderPoints = rawStandings.length > 0 ? parseFloat(rawStandings[0].points) || 0 : 0

    return rawStandings.map((item: any) => {
      const pts = parseFloat(item.points) || 0
      return {
        position: parseInt(item.position, 10),
        points: pts,
        wins: parseInt(item.wins, 10) || 0,
        driver: item.Driver,
        constructor: item.Constructors?.[0] || { constructorId: 'unknown', name: 'Independent', nationality: '' },
        gapToLeader: leaderPoints > 0 ? leaderPoints - pts : 0,
      }
    })
  }

  /**
   * Fetches constructor standings with computed leader gaps.
   */
  async getConstructorStandings(season: string = 'current'): Promise<ConstructorStandingItem[]> {
    const data = await this.request<any>(`/${season}/constructorStandings.json`)
    const lists = data?.MRData?.StandingsTable?.StandingsLists?.[0]
    const rawStandings = lists?.ConstructorStandings || []

    const leaderPoints = rawStandings.length > 0 ? parseFloat(rawStandings[0].points) || 0 : 0

    return rawStandings.map((item: any) => {
      const pts = parseFloat(item.points) || 0
      return {
        position: parseInt(item.position, 10),
        points: pts,
        wins: parseInt(item.wins, 10) || 0,
        constructor: item.Constructor,
        gapToLeader: leaderPoints > 0 ? leaderPoints - pts : 0,
      }
    })
  }

  /**
   * Fetches list of available championship seasons dynamically.
   * Ensures no hardcoded years.
   */
  async getSeasons(): Promise<string[]> {
    try {
      const data = await this.request<any>('/seasons.json?limit=100&offset=50')
      const table = data?.MRData?.SeasonTable?.Seasons || []
      const years = table.map((s: any) => s.season).reverse()
      if (years.length > 0) return years
      // Derive fallback from current year
      const currentYear = new Date().getFullYear()
      return Array.from({ length: 7 }, (_, i) => String(currentYear - i))
    } catch {
      const currentYear = new Date().getFullYear()
      return Array.from({ length: 7 }, (_, i) => String(currentYear - i))
    }
  }
}

export const jolpicaClient = new JolpicaClient()
