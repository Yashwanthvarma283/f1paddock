import { useQuery } from '@tanstack/react-query'
import type {
  RawRace,
  RawQualifyingRace,
  RawDriver,
  SeasonInsightsData,
} from '@/features/dashboard-v2/insights/types'
import { computeSeasonInsights } from '@/features/dashboard-v2/insights/calculations'

const BASE_URL = 'https://api.jolpi.ca/ergast/f1'

async function fetchPaginatedResults(year: string): Promise<RawRace[]> {
  let offset = 0
  const limit = 100
  let total = 0
  const allRaces = new Map<string, RawRace>()

  do {
    const url = `${BASE_URL}/${year}/results.json?limit=${limit}&offset=${offset}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to load results (${res.status})`)
    }
    const data = await res.json()
    total = parseInt(data?.MRData?.total || '0', 10)
    const races: any[] = data?.MRData?.RaceTable?.Races || []

    for (const r of races) {
      if (!allRaces.has(r.round)) {
        allRaces.set(r.round, {
          season: r.season,
          round: r.round,
          raceName: r.raceName,
          date: r.date,
          Results: r.Results ? [...r.Results] : [],
        })
      } else {
        const existing = allRaces.get(r.round)!
        if (r.Results) {
          existing.Results.push(...r.Results)
        }
      }
    }

    offset += limit
  } while (offset < total)

  return Array.from(allRaces.values())
}

async function fetchPaginatedQualifying(year: string): Promise<RawQualifyingRace[]> {
  let offset = 0
  const limit = 100
  let total = 0
  const allQualRaces = new Map<string, RawQualifyingRace>()

  do {
    const url = `${BASE_URL}/${year}/qualifying.json?limit=${limit}&offset=${offset}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to load qualifying (${res.status})`)
    }
    const data = await res.json()
    total = parseInt(data?.MRData?.total || '0', 10)
    const races: any[] = data?.MRData?.RaceTable?.Races || []

    for (const r of races) {
      if (!allQualRaces.has(r.round)) {
        allQualRaces.set(r.round, {
          season: r.season,
          round: r.round,
          raceName: r.raceName,
          date: r.date,
          QualifyingResults: r.QualifyingResults ? [...r.QualifyingResults] : [],
        })
      } else {
        const existing = allQualRaces.get(r.round)!
        if (r.QualifyingResults) {
          existing.QualifyingResults.push(...r.QualifyingResults)
        }
      }
    }

    offset += limit
  } while (offset < total)

  return Array.from(allQualRaces.values())
}

async function fetchDrivers(year: string): Promise<RawDriver[]> {
  const url = `${BASE_URL}/${year}/drivers.json?limit=100`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load drivers (${res.status})`)
  }
  const data = await res.json()
  return data?.MRData?.DriverTable?.Drivers || []
}

export function useSeasonInsights(year: string = 'current', enabled: boolean = true) {
  return useQuery<SeasonInsightsData>({
    queryKey: ['f1', 'seasonInsights', year],
    queryFn: async () => {
      const [races, qualRaces, drivers] = await Promise.all([
        fetchPaginatedResults(year),
        fetchPaginatedQualifying(year),
        fetchDrivers(year),
      ])

      return computeSeasonInsights(year, races, qualRaces, drivers, new Date())
    },
    enabled: Boolean(enabled && year),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  })
}
