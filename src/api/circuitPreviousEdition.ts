/**
 * Previous race edition at a circuit data models and pure selection logic.
 * Adheres to SRP: exactly one responsibility of evaluating historical edition results.
 */

export interface CircuitPreviousEdition {
  season: string
  round: string
  raceName: string
  winnerName: string
  winnerCode?: string
  constructorName: string
  laps: string
}

/**
 * Selects the most recent completed edition of a Grand Prix at a circuit
 * that took place prior to the current / active season.
 */
export function selectPreviousEdition(
  races: any[] | null | undefined,
  currentSeason: number | string = new Date().getFullYear()
): CircuitPreviousEdition | null {
  if (!races || !Array.isArray(races) || races.length === 0) {
    return null
  }

  const targetYear = typeof currentSeason === 'string' ? parseInt(currentSeason, 10) : currentSeason

  const priorRaces = races
    .filter((r) => {
      const year = parseInt(r.season, 10)
      return !isNaN(year) && year < targetYear && Array.isArray(r.Results) && r.Results.length > 0
    })
    .sort((a, b) => {
      const yearA = parseInt(a.season, 10)
      const yearB = parseInt(b.season, 10)
      if (yearA !== yearB) return yearA - yearB
      return parseInt(a.round || '0', 10) - parseInt(b.round || '0', 10)
    })

  if (priorRaces.length === 0) {
    return null
  }

  const latestPrior = priorRaces[priorRaces.length - 1]
  const winnerResult = latestPrior.Results[0]
  if (!winnerResult || !winnerResult.Driver) {
    return null
  }

  const givenName = winnerResult.Driver.givenName || ''
  const familyName = winnerResult.Driver.familyName || ''
  const winnerName = `${givenName} ${familyName}`.trim()

  return {
    season: latestPrior.season,
    round: latestPrior.round,
    raceName: latestPrior.raceName,
    winnerName,
    winnerCode: winnerResult.Driver.code,
    constructorName: winnerResult.Constructor?.name || '',
    laps: String(winnerResult.laps || ''),
  }
}
