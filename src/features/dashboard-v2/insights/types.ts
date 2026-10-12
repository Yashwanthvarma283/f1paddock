export interface RawDriver {
  driverId: string
  permanentNumber?: string
  code?: string
  givenName: string
  familyName: string
  dateOfBirth?: string
  nationality: string
}

export interface RawConstructor {
  constructorId: string
  name: string
  nationality?: string
}

export interface RawResultItem {
  number: string
  position: string
  positionText: string
  points: string
  grid: string
  laps: string
  status: string
  FastestLap?: {
    rank: string
    lap: string
    Time?: { time: string }
  }
  Driver: RawDriver
  Constructor: RawConstructor
}

export interface RawQualifyingItem {
  number: string
  position: string
  Driver: RawDriver
  Constructor: RawConstructor
  Q1?: string
  Q2?: string
  Q3?: string
}

export interface RawRace {
  season: string
  round: string
  raceName: string
  date: string
  Results: RawResultItem[]
}

export interface RawQualifyingRace {
  season: string
  round: string
  raceName: string
  date: string
  QualifyingResults: RawQualifyingItem[]
}

// Derived insight contracts
export interface PlacesGainedDriver {
  driverId: string
  code: string
  givenName: string
  familyName: string
  constructorId: string
  constructorName: string
  avgPlacesGained: number
  totalGained: number
  validStarts: number
}

export interface ComebackPerformance {
  driverId: string
  code: string
  givenName: string
  familyName: string
  raceName: string
  round: string
  grid: number
  position: number
  placesGained: number
}

export interface FastestLapLeader {
  driverId: string
  code: string
  givenName: string
  familyName: string
  constructorId: string
  count: number
}

export interface RaceCraftInsight {
  topPlacesGained: PlacesGainedDriver[]
  bestComeback: ComebackPerformance | null
  fastestLapsTop3: FastestLapLeader[]
}

export interface PoleLeader {
  driverId: string
  code: string
  givenName: string
  familyName: string
  constructorId: string
  count: number
}

export interface QualiAvgDriver {
  driverId: string
  code: string
  givenName: string
  familyName: string
  constructorId: string
  avgPosition: number
  sessionsCount: number
}

export interface QualifyingInsight {
  topPoles: PoleLeader[]
  topAvgQuali: QualiAvgDriver[]
}

export interface TeammateComparison {
  constructorId: string
  constructorName: string
  driver1: {
    driverId: string
    code: string
    givenName: string
    familyName: string
  }
  driver2: {
    driverId: string
    code: string
    givenName: string
    familyName: string
  }
  sharedRounds: number
  qualiH2H: {
    driver1Wins: number
    driver2Wins: number
    total: number
  }
  raceH2H: {
    driver1Wins: number
    driver2Wins: number
    total: number
  }
}

export interface StreakLeader {
  driverId: string
  code: string
  givenName: string
  familyName: string
  constructorId: string
  streak: number
}

export interface StreaksInsight {
  pointsStreaks: StreakLeader[]
  classifiedStreaks: StreakLeader[]
}

export interface SpotlightHistoryPoint {
  round: number
  position: number | null // null for DNF
  isDnf: boolean
}

export interface SpotlightDriver {
  driverId: string
  code: string
  givenName: string
  familyName: string
  constructorId: string
  constructorName: string
  permanentNumber?: string
  avgLast5: number
  avgPrev5: number
  improvement: number
  history: SpotlightHistoryPoint[]
  reasonSentence: string
}

export interface GridFactsInsight {
  oldestDriver: {
    driverId: string
    code: string
    givenName: string
    familyName: string
    constructorId: string
    ageYears: number
    ageMonths: number
  } | null
  youngestDriver: {
    driverId: string
    code: string
    givenName: string
    familyName: string
    constructorId: string
    ageYears: number
    ageMonths: number
  } | null
  nationalitiesCount: number
  nextBirthday: {
    driverId: string
    code: string
    givenName: string
    familyName: string
    constructorId: string
    dateString: string
    turningAge: number
  } | null
}

export interface SeasonInsightsData {
  season: string
  completedRounds: number
  raceCraft: RaceCraftInsight
  qualifying: QualifyingInsight
  teammates: TeammateComparison[]
  streaks: StreaksInsight
  spotlight: SpotlightDriver | null
  gridFacts: GridFactsInsight
}
