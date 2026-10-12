import type {
  RawRace,
  RawQualifyingRace,
  RawDriver,
  RaceCraftInsight,
  QualifyingInsight,
  TeammateComparison,
  StreaksInsight,
  SpotlightDriver,
  GridFactsInsight,
  SeasonInsightsData,
  PlacesGainedDriver,
  ComebackPerformance,
  FastestLapLeader,
  PoleLeader,
  QualiAvgDriver,
  StreakLeader,
  SpotlightHistoryPoint,
} from './types'

export function isClassifiedFinish(status: string, positionText?: string): boolean {
  if (!status) return false
  if (positionText === 'R' || positionText === 'D' || positionText === 'W') return false
  if (status === 'Finished') return true
  if (status.startsWith('+')) return true // e.g. +1 Lap, +2 Laps
  if (
    status === 'Retired' ||
    status === 'Disqualified' ||
    status === 'Accident' ||
    status === 'Collision' ||
    status === 'Engine' ||
    status === 'Gearbox' ||
    status === 'Brakes' ||
    status === 'Suspension' ||
    status === 'Electrical'
  ) {
    return false
  }
  return false
}

/**
 * 1. Race craft calculation
 */
export function computeRaceCraft(races: RawRace[], minStarts = 3): RaceCraftInsight {
  const driverStats = new Map<
    string,
    {
      driver: RawDriver
      constructorId: string
      constructorName: string
      totalGained: number
      validStarts: number
    }
  >()

  const fastestLapCounts = new Map<
    string,
    { driver: RawDriver; constructorId: string; count: number }
  >()

  let bestComeback: ComebackPerformance | null = null

  for (const race of races) {
    for (const res of race.Results || []) {
      const grid = parseInt(res.grid, 10)
      const finishPos = parseInt(res.position, 10)
      const driverId = res.Driver.driverId

      // Places gained: only for drivers with grid slot > 0 (pit-lane starts grid===0 excluded)
      if (!isNaN(grid) && grid > 0 && !isNaN(finishPos)) {
        const placesGained = grid - finishPos
        const current = driverStats.get(driverId) || {
          driver: res.Driver,
          constructorId: res.Constructor.constructorId,
          constructorName: res.Constructor.name,
          totalGained: 0,
          validStarts: 0,
        }
        current.totalGained += placesGained
        current.validStarts += 1
        current.constructorId = res.Constructor.constructorId
        current.constructorName = res.Constructor.name
        driverStats.set(driverId, current)

        // Check single best comeback
        if (!bestComeback || placesGained > bestComeback.placesGained) {
          bestComeback = {
            driverId,
            code: res.Driver.code || res.Driver.familyName.slice(0, 3).toUpperCase(),
            givenName: res.Driver.givenName,
            familyName: res.Driver.familyName,
            raceName: race.raceName,
            round: race.round,
            grid,
            position: finishPos,
            placesGained,
          }
        }
      }

      // Fastest Lap count: rank === '1'
      if (res.FastestLap?.rank === '1') {
        const currentFL = fastestLapCounts.get(driverId) || {
          driver: res.Driver,
          constructorId: res.Constructor.constructorId,
          count: 0,
        }
        currentFL.count += 1
        fastestLapCounts.set(driverId, currentFL)
      }
    }
  }

  // Top 5 places gained
  const placesGainedList: PlacesGainedDriver[] = []
  for (const [driverId, data] of driverStats.entries()) {
    if (data.validStarts >= minStarts) {
      placesGainedList.push({
        driverId,
        code: data.driver.code || data.driver.familyName.slice(0, 3).toUpperCase(),
        givenName: data.driver.givenName,
        familyName: data.driver.familyName,
        constructorId: data.constructorId,
        constructorName: data.constructorName,
        avgPlacesGained: Number((data.totalGained / data.validStarts).toFixed(2)),
        totalGained: data.totalGained,
        validStarts: data.validStarts,
      })
    }
  }

  placesGainedList.sort((a, b) => {
    if (b.avgPlacesGained !== a.avgPlacesGained) {
      return b.avgPlacesGained - a.avgPlacesGained
    }
    return b.validStarts - a.validStarts // tie breaker: more starts
  })

  // Fastest lap top 3
  const fastestLapsTop3: FastestLapLeader[] = Array.from(fastestLapCounts.entries())
    .map(([driverId, data]) => ({
      driverId,
      code: data.driver.code || data.driver.familyName.slice(0, 3).toUpperCase(),
      givenName: data.driver.givenName,
      familyName: data.driver.familyName,
      constructorId: data.constructorId,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return {
    topPlacesGained: placesGainedList.slice(0, 5),
    bestComeback,
    fastestLapsTop3,
  }
}

/**
 * 2. Qualifying calculations
 */
export function computeQualifying(qualRaces: RawQualifyingRace[], minStarts = 3): QualifyingInsight {
  const poleCounts = new Map<
    string,
    { driver: RawDriver; constructorId: string; count: number }
  >()
  const qualiPosTotals = new Map<
    string,
    { driver: RawDriver; constructorId: string; sumPos: number; count: number }
  >()

  for (const race of qualRaces) {
    for (const q of race.QualifyingResults || []) {
      const pos = parseInt(q.position, 10)
      const driverId = q.Driver.driverId

      if (!isNaN(pos)) {
        if (pos === 1) {
          const currentPole = poleCounts.get(driverId) || {
            driver: q.Driver,
            constructorId: q.Constructor.constructorId,
            count: 0,
          }
          currentPole.count += 1
          poleCounts.set(driverId, currentPole)
        }

        const currentPos = qualiPosTotals.get(driverId) || {
          driver: q.Driver,
          constructorId: q.Constructor.constructorId,
          sumPos: 0,
          count: 0,
        }
        currentPos.sumPos += pos
        currentPos.count += 1
        currentPos.constructorId = q.Constructor.constructorId
        qualiPosTotals.set(driverId, currentPos)
      }
    }
  }

  // Top 5 poles
  const topPoles: PoleLeader[] = Array.from(poleCounts.entries())
    .map(([driverId, data]) => ({
      driverId,
      code: data.driver.code || data.driver.familyName.slice(0, 3).toUpperCase(),
      givenName: data.driver.givenName,
      familyName: data.driver.familyName,
      constructorId: data.constructorId,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Top 5 lowest average qualifying position (minStarts)
  const topAvgQuali: QualiAvgDriver[] = []
  for (const [driverId, data] of qualiPosTotals.entries()) {
    if (data.count >= minStarts) {
      topAvgQuali.push({
        driverId,
        code: data.driver.code || data.driver.familyName.slice(0, 3).toUpperCase(),
        givenName: data.driver.givenName,
        familyName: data.driver.familyName,
        constructorId: data.constructorId,
        avgPosition: Number((data.sumPos / data.count).toFixed(2)),
        sessionsCount: data.count,
      })
    }
  }

  topAvgQuali.sort((a, b) => {
    if (a.avgPosition !== b.avgPosition) {
      return a.avgPosition - b.avgPosition // lower is better in qualifying
    }
    return b.sessionsCount - a.sessionsCount // tie breaker: more sessions
  })

  return {
    topPoles,
    topAvgQuali: topAvgQuali.slice(0, 5),
  }
}

/**
 * 3. Teammate head-to-head calculations
 */
export function computeTeammates(
  races: RawRace[],
  qualRaces: RawQualifyingRace[]
): TeammateComparison[] {
  // 1. Group driver starts per constructor
  const teamDriverStarts = new Map<
    string,
    {
      constructorName: string
      drivers: Map<string, { driver: RawDriver; count: number }>
    }
  >()

  for (const race of races) {
    for (const res of race.Results || []) {
      const cId = res.Constructor.constructorId
      const dId = res.Driver.driverId
      if (!teamDriverStarts.has(cId)) {
        teamDriverStarts.set(cId, {
          constructorName: res.Constructor.name,
          drivers: new Map(),
        })
      }
      const teamData = teamDriverStarts.get(cId)!
      const dCount = teamData.drivers.get(dId) || { driver: res.Driver, count: 0 }
      dCount.count += 1
      teamData.drivers.set(dId, dCount)
    }
  }

  const results: TeammateComparison[] = []

  // 2. For each constructor, pick top 2 drivers by starts
  for (const [cId, teamData] of teamDriverStarts.entries()) {
    const driverList = Array.from(teamData.drivers.values()).sort(
      (a, b) => b.count - a.count
    )

    if (driverList.length < 2) continue

    const d1 = driverList[0].driver
    const d2 = driverList[1].driver

    let sharedRounds = 0
    let quali1Wins = 0
    let quali2Wins = 0
    let race1Wins = 0
    let race2Wins = 0

    // Qualifying comparison
    for (const qRace of qualRaces) {
      const q1 = qRace.QualifyingResults?.find((q) => q.Driver.driverId === d1.driverId)
      const q2 = qRace.QualifyingResults?.find((q) => q.Driver.driverId === d2.driverId)

      if (q1 && q2) {
        const pos1 = parseInt(q1.position, 10)
        const pos2 = parseInt(q2.position, 10)
        if (!isNaN(pos1) && !isNaN(pos2)) {
          if (pos1 < pos2) quali1Wins += 1
          else if (pos2 < pos1) quali2Wins += 1
        }
      }
    }

    // Race comparison
    for (const race of races) {
      const r1 = race.Results?.find((r) => r.Driver.driverId === d1.driverId)
      const r2 = race.Results?.find((r) => r.Driver.driverId === d2.driverId)

      if (r1 && r2) {
        sharedRounds += 1
        const class1 = isClassifiedFinish(r1.status, r1.positionText)
        const class2 = isClassifiedFinish(r2.status, r2.positionText)

        // Only count rounds where both were classified
        if (class1 && class2) {
          const pos1 = parseInt(r1.position, 10)
          const pos2 = parseInt(r2.position, 10)
          if (!isNaN(pos1) && !isNaN(pos2)) {
            if (pos1 < pos2) race1Wins += 1
            else if (pos2 < pos1) race2Wins += 1
          }
        }
      }
    }

    results.push({
      constructorId: cId,
      constructorName: teamData.constructorName,
      driver1: {
        driverId: d1.driverId,
        code: d1.code || d1.familyName.slice(0, 3).toUpperCase(),
        givenName: d1.givenName,
        familyName: d1.familyName,
      },
      driver2: {
        driverId: d2.driverId,
        code: d2.code || d2.familyName.slice(0, 3).toUpperCase(),
        givenName: d2.givenName,
        familyName: d2.familyName,
      },
      sharedRounds,
      qualiH2H: {
        driver1Wins: quali1Wins,
        driver2Wins: quali2Wins,
        total: quali1Wins + quali2Wins,
      },
      raceH2H: {
        driver1Wins: race1Wins,
        driver2Wins: race2Wins,
        total: race1Wins + race2Wins,
      },
    })
  }

  // Sort by constructor name for a predictable order
  results.sort((a, b) => a.constructorName.localeCompare(b.constructorName))
  return results
}

/**
 * 4. Streaks calculations (active consecutive streaks as of latest completed round)
 */
export function computeStreaks(races: RawRace[]): StreaksInsight {
  if (races.length === 0) {
    return { pointsStreaks: [], classifiedStreaks: [] }
  }

  // Sort races by round ascending, then reverse to scan backward from the latest race
  const sortedRaces = [...races].sort(
    (a, b) => parseInt(a.round, 10) - parseInt(b.round, 10)
  )
  const reversedRaces = [...sortedRaces].reverse()

  const driverMap = new Map<string, { driver: RawDriver; constructorId: string }>()
  const pointsStreakMap = new Map<string, number>()
  const finishStreakMap = new Map<string, number>()

  // Gather active drivers from the latest race
  const latestRace = reversedRaces[0]
  for (const res of latestRace.Results || []) {
    driverMap.set(res.Driver.driverId, {
      driver: res.Driver,
      constructorId: res.Constructor.constructorId,
    })
  }

  for (const [driverId] of driverMap.entries()) {
    let pStreak = 0
    let fStreak = 0
    let pActive = true
    let fActive = true

    for (const race of reversedRaces) {
      const res = race.Results?.find((r) => r.Driver.driverId === driverId)
      if (!res) {
        // Driver was not in this race, stop both streaks
        break
      }

      // Check points streak
      const pts = parseFloat(res.points) || 0
      if (pActive && pts > 0) {
        pStreak += 1
      } else {
        pActive = false
      }

      // Check classified finish streak
      const isClassified = isClassifiedFinish(res.status, res.positionText)
      if (fActive && isClassified) {
        fStreak += 1
      } else {
        fActive = false
      }

      if (!pActive && !fActive) break
    }

    pointsStreakMap.set(driverId, pStreak)
    finishStreakMap.set(driverId, fStreak)
  }

  const pointsStreaks: StreakLeader[] = Array.from(pointsStreakMap.entries())
    .filter(([, streak]) => streak > 0)
    .map(([driverId, streak]) => {
      const d = driverMap.get(driverId)!
      return {
        driverId,
        code: d.driver.code || d.driver.familyName.slice(0, 3).toUpperCase(),
        givenName: d.driver.givenName,
        familyName: d.driver.familyName,
        constructorId: d.constructorId,
        streak,
      }
    })
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3)

  const classifiedStreaks: StreakLeader[] = Array.from(finishStreakMap.entries())
    .filter(([, streak]) => streak > 0)
    .map(([driverId, streak]) => {
      const d = driverMap.get(driverId)!
      return {
        driverId,
        code: d.driver.code || d.driver.familyName.slice(0, 3).toUpperCase(),
        givenName: d.driver.givenName,
        familyName: d.driver.familyName,
        constructorId: d.constructorId,
        streak,
      }
    })
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3)

  return { pointsStreaks, classifiedStreaks }
}

/**
 * 5. Spotlight driver calculation
 */
export function computeSpotlight(
  races: RawRace[],
  drivers: RawDriver[]
): SpotlightDriver | null {
  if (races.length === 0) return null

  const sortedRaces = [...races].sort(
    (a, b) => parseInt(a.round, 10) - parseInt(b.round, 10)
  )
  const completedRoundsCount = sortedRaces.length

  const driverHistoryMap = new Map<
    string,
    {
      driver: RawDriver
      constructorId: string
      constructorName: string
      history: SpotlightHistoryPoint[]
      startsCount: number
    }
  >()

  for (const race of sortedRaces) {
    const roundNum = parseInt(race.round, 10)
    for (const res of race.Results || []) {
      const dId = res.Driver.driverId
      if (!driverHistoryMap.has(dId)) {
        driverHistoryMap.set(dId, {
          driver: res.Driver,
          constructorId: res.Constructor.constructorId,
          constructorName: res.Constructor.name,
          history: [],
          startsCount: 0,
        })
      }
      const data = driverHistoryMap.get(dId)!
      data.constructorId = res.Constructor.constructorId
      data.constructorName = res.Constructor.name
      data.startsCount += 1

      const pos = parseInt(res.position, 10)
      const isDnf = !isClassifiedFinish(res.status, res.positionText)
      data.history.push({
        round: roundNum,
        position: !isNaN(pos) ? pos : null,
        isDnf,
      })
    }
  }

  // Check candidates for 10-race window improvement if >= 8 rounds completed
  let bestCandidate: {
    driverId: string
    avgLast5: number
    avgPrev5: number
    improvement: number
  } | null = null

  if (completedRoundsCount >= 8) {
    for (const [dId, data] of driverHistoryMap.entries()) {
      if (data.startsCount >= 8 && data.history.length >= 8) {
        // Last 5 races
        const last5 = data.history.slice(-5)
        // 5 races prior to the last 5
        const prev5 = data.history.slice(-10, -5)

        if (prev5.length >= 3) {
          const sumLast5 = last5.reduce(
            (acc, curr) => acc + (curr.position ?? 20),
            0
          )
          const sumPrev5 = prev5.reduce(
            (acc, curr) => acc + (curr.position ?? 20),
            0
          )
          const avgLast5 = Number((sumLast5 / last5.length).toFixed(1))
          const avgPrev5 = Number((sumPrev5 / prev5.length).toFixed(1))
          const improvement = Number((avgPrev5 - avgLast5).toFixed(1)) // positive = improved toward P1

          if (!bestCandidate || improvement > bestCandidate.improvement) {
            bestCandidate = { driverId: dId, avgLast5, avgPrev5, improvement }
          }
        }
      }
    }
  }

  // Fallback: driver with best average finish over last 5
  if (!bestCandidate) {
    let fallbackBestAvg = 99
    let fallbackDriverId = ''
    let fallbackAvgLast5 = 20

    for (const [dId, data] of driverHistoryMap.entries()) {
      if (data.history.length >= 1) {
        const last5 = data.history.slice(-5)
        const sum = last5.reduce((acc, curr) => acc + (curr.position ?? 20), 0)
        const avg = Number((sum / last5.length).toFixed(1))
        if (avg < fallbackBestAvg) {
          fallbackBestAvg = avg
          fallbackDriverId = dId
          fallbackAvgLast5 = avg
        }
      }
    }

    if (fallbackDriverId) {
      bestCandidate = {
        driverId: fallbackDriverId,
        avgLast5: fallbackAvgLast5,
        avgPrev5: fallbackAvgLast5,
        improvement: 0,
      }
    }
  }

  if (!bestCandidate) return null

  const data = driverHistoryMap.get(bestCandidate.driverId)!
  const driverDetail =
    drivers.find((d) => d.driverId === bestCandidate!.driverId) || data.driver

  const code =
    driverDetail.code || driverDetail.familyName.slice(0, 3).toUpperCase()
  const fullName = `${driverDetail.givenName} ${driverDetail.familyName}`

  const reasonSentence =
    bestCandidate.improvement > 0
      ? `${fullName} improved average finishing position from ${bestCandidate.avgPrev5} to ${bestCandidate.avgLast5} across recent Grands Prix.`
      : `${fullName} holds the strongest recent momentum on the grid with an average finish of ${bestCandidate.avgLast5} across the last 5 races.`

  return {
    driverId: bestCandidate.driverId,
    code,
    givenName: driverDetail.givenName,
    familyName: driverDetail.familyName,
    constructorId: data.constructorId,
    constructorName: data.constructorName,
    permanentNumber: driverDetail.permanentNumber,
    avgLast5: bestCandidate.avgLast5,
    avgPrev5: bestCandidate.avgPrev5,
    improvement: bestCandidate.improvement,
    history: data.history,
    reasonSentence,
  }
}

/**
 * 6. Grid facts strip
 */
export function computeGridFacts(
  drivers: RawDriver[],
  races: RawRace[],
  currentDate = new Date()
): GridFactsInsight {
  // Only consider active drivers who competed in at least 1 race
  const activeDriverIds = new Set<string>()
  const driverConstructorMap = new Map<string, string>()

  for (const race of races) {
    for (const res of race.Results || []) {
      activeDriverIds.add(res.Driver.driverId)
      driverConstructorMap.set(
        res.Driver.driverId,
        res.Constructor.constructorId
      )
    }
  }

  const activeDrivers = drivers.filter((d) => activeDriverIds.has(d.driverId))

  // Driver ages calculation
  const validDriversWithDob = activeDrivers.filter(
    (d) => d.dateOfBirth && !isNaN(new Date(d.dateOfBirth).getTime())
  )

  const ages = validDriversWithDob.map((d) => {
    const dob = new Date(d.dateOfBirth!)
    let ageYears = currentDate.getFullYear() - dob.getFullYear()
    let ageMonths = currentDate.getMonth() - dob.getMonth()
    if (currentDate.getDate() < dob.getDate()) {
      ageMonths -= 1
    }
    if (ageMonths < 0) {
      ageYears -= 1
      ageMonths += 12
    }

    // Next birthday calculation
    const thisYearBday = new Date(
      currentDate.getFullYear(),
      dob.getMonth(),
      dob.getDate()
    )
    let nextBday = thisYearBday
    let turningAge = ageYears + 1
    if (thisYearBday.getTime() < currentDate.getTime()) {
      nextBday = new Date(
        currentDate.getFullYear() + 1,
        dob.getMonth(),
        dob.getDate()
      )
    }
    const daysUntil = (nextBday.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)

    return {
      driver: d,
      dob,
      ageYears,
      ageMonths,
      nextBday,
      turningAge,
      daysUntil,
    }
  })

  ages.sort((a, b) => a.dob.getTime() - b.dob.getTime()) // oldest first

  const oldest = ages[0]
  const youngest = ages[ages.length - 1]

  const oldestDriver = oldest
    ? {
        driverId: oldest.driver.driverId,
        code:
          oldest.driver.code ||
          oldest.driver.familyName.slice(0, 3).toUpperCase(),
        givenName: oldest.driver.givenName,
        familyName: oldest.driver.familyName,
        constructorId:
          driverConstructorMap.get(oldest.driver.driverId) || 'aston_martin',
        ageYears: oldest.ageYears,
        ageMonths: oldest.ageMonths,
      }
    : null

  const youngestDriver = youngest
    ? {
        driverId: youngest.driver.driverId,
        code:
          youngest.driver.code ||
          youngest.driver.familyName.slice(0, 3).toUpperCase(),
        givenName: youngest.driver.givenName,
        familyName: youngest.driver.familyName,
        constructorId:
          driverConstructorMap.get(youngest.driver.driverId) || 'rb',
        ageYears: youngest.ageYears,
        ageMonths: youngest.ageMonths,
      }
    : null

  // Nationalities count
  const nats = new Set(
    activeDrivers.map((d) => d.nationality).filter(Boolean)
  )

  // Next birthday
  const sortedByNextBday = [...ages].sort((a, b) => a.daysUntil - b.daysUntil)
  const next = sortedByNextBday[0]

  let nextBirthday: GridFactsInsight['nextBirthday'] = null
  if (next) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    const dateString = `${monthNames[next.nextBday.getMonth()]} ${next.nextBday.getDate()}`
    nextBirthday = {
      driverId: next.driver.driverId,
      code:
        next.driver.code ||
        next.driver.familyName.slice(0, 3).toUpperCase(),
      givenName: next.driver.givenName,
      familyName: next.driver.familyName,
      constructorId:
        driverConstructorMap.get(next.driver.driverId) || 'sauber',
      dateString,
      turningAge: next.turningAge,
    }
  }

  return {
    oldestDriver,
    youngestDriver,
    nationalitiesCount: nats.size,
    nextBirthday,
  }
}

/**
 * Aggregator for all season insights
 */
export function computeSeasonInsights(
  season: string,
  races: RawRace[],
  qualRaces: RawQualifyingRace[],
  drivers: RawDriver[],
  currentDate = new Date()
): SeasonInsightsData {
  const completedRounds = races.length

  return {
    season,
    completedRounds,
    raceCraft: computeRaceCraft(races),
    qualifying: computeQualifying(qualRaces),
    teammates: computeTeammates(races, qualRaces),
    streaks: computeStreaks(races),
    spotlight: computeSpotlight(races, drivers),
    gridFacts: computeGridFacts(drivers, races, currentDate),
  }
}
