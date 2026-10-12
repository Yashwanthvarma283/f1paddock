import { describe, it, expect } from 'vitest'
import {
  computeRaceCraft,
  computeQualifying,
  computeTeammates,
  computeStreaks,
  computeSpotlight,
  computeGridFacts,
  isClassifiedFinish,
} from './calculations'
import type { RawRace, RawQualifyingRace, RawDriver } from './types'

describe('calculations.ts - Driver Insights Unit Tests', () => {
  const driverHamilton: RawDriver = {
    driverId: 'hamilton',
    code: 'HAM',
    givenName: 'Lewis',
    familyName: 'Hamilton',
    dateOfBirth: '1985-01-07',
    nationality: 'British',
    permanentNumber: '44',
  }

  const driverLeclerc: RawDriver = {
    driverId: 'leclerc',
    code: 'LEC',
    givenName: 'Charles',
    familyName: 'Leclerc',
    dateOfBirth: '1997-10-16',
    nationality: 'Monegasque',
    permanentNumber: '16',
  }

  const driverBearman: RawDriver = {
    driverId: 'bearman',
    code: 'BEA',
    givenName: 'Oliver',
    familyName: 'Bearman',
    dateOfBirth: '2005-05-08',
    nationality: 'British',
    permanentNumber: '87',
  }

  const driverVerstappen: RawDriver = {
    driverId: 'verstappen',
    code: 'VER',
    givenName: 'Max',
    familyName: 'Verstappen',
    dateOfBirth: '1997-09-30',
    nationality: 'Dutch',
    permanentNumber: '1',
  }

  const ferrariConstructor = {
    constructorId: 'ferrari',
    name: 'Ferrari',
  }

  const redBullConstructor = {
    constructorId: 'red_bull',
    name: 'Red Bull Racing',
  }

  describe('isClassifiedFinish', () => {
    it('correctly classifies Finished and +1 Lap finishes', () => {
      expect(isClassifiedFinish('Finished')).toBe(true)
      expect(isClassifiedFinish('+1 Lap')).toBe(true)
      expect(isClassifiedFinish('+2 Laps')).toBe(true)
    })

    it('correctly identifies DNFs and retirements', () => {
      expect(isClassifiedFinish('Retired')).toBe(false)
      expect(isClassifiedFinish('Accident')).toBe(false)
      expect(isClassifiedFinish('Collision')).toBe(false)
      expect(isClassifiedFinish('Finished', 'R')).toBe(false)
    })
  })

  describe('Race Craft (Pit-Lane Start & DNF Fixture)', () => {
    it('excludes pit-lane starts (grid=0) from places gained calculations', () => {
      const mockRaces: RawRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'Race 1',
          date: '2026-03-01',
          Results: [
            // Started grid 10, finished 5 -> +5
            {
              number: '44',
              position: '5',
              positionText: '5',
              points: '10',
              grid: '10',
              laps: '50',
              status: 'Finished',
              Driver: driverHamilton,
              Constructor: ferrariConstructor,
            },
          ],
        },
        {
          season: '2026',
          round: '2',
          raceName: 'Race 2',
          date: '2026-03-08',
          Results: [
            // Started pit lane (grid 0), finished 8 -> MUST BE EXCLUDED from average
            {
              number: '44',
              position: '8',
              positionText: '8',
              points: '4',
              grid: '0',
              laps: '50',
              status: 'Finished',
              Driver: driverHamilton,
              Constructor: ferrariConstructor,
            },
          ],
        },
        {
          season: '2026',
          round: '3',
          raceName: 'Race 3',
          date: '2026-03-15',
          Results: [
            // Started grid 12, finished 6 -> +6
            {
              number: '44',
              position: '6',
              positionText: '6',
              points: '8',
              grid: '12',
              laps: '50',
              status: 'Finished',
              Driver: driverHamilton,
              Constructor: ferrariConstructor,
            },
          ],
        },
        {
          season: '2026',
          round: '4',
          raceName: 'Race 4',
          date: '2026-03-22',
          Results: [
            // Started grid 8, finished 4 -> +4
            {
              number: '44',
              position: '4',
              positionText: '4',
              points: '12',
              grid: '8',
              laps: '50',
              status: 'Finished',
              Driver: driverHamilton,
              Constructor: ferrariConstructor,
            },
          ],
        },
      ]

      const result = computeRaceCraft(mockRaces, 3)
      const ham = result.topPlacesGained.find((d) => d.driverId === 'hamilton')

      expect(ham).toBeDefined()
      // Out of 4 races, round 2 was pit-lane start (grid 0), so validStarts = 3
      expect(ham?.validStarts).toBe(3)
      // Total gained = (+5) + (+6) + (+4) = 15. Avg = 15 / 3 = 5.0
      expect(ham?.totalGained).toBe(15)
      expect(ham?.avgPlacesGained).toBe(5)
    })

    it('identifies best comeback and fastest laps', () => {
      const mockRaces: RawRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'Monza',
          date: '2026-09-06',
          Results: [
            {
              number: '1',
              position: '1',
              positionText: '1',
              points: '25',
              grid: '19', // Started P19, won P1 = +18 comeback
              laps: '53',
              status: 'Finished',
              FastestLap: { rank: '1', lap: '45' },
              Driver: driverVerstappen,
              Constructor: redBullConstructor,
            },
          ],
        },
      ]

      const result = computeRaceCraft(mockRaces, 1)
      expect(result.bestComeback).toEqual({
        driverId: 'verstappen',
        code: 'VER',
        givenName: 'Max',
        familyName: 'Verstappen',
        raceName: 'Monza',
        round: '1',
        grid: 19,
        position: 1,
        placesGained: 18,
      })

      expect(result.fastestLapsTop3[0].driverId).toBe('verstappen')
      expect(result.fastestLapsTop3[0].count).toBe(1)
    })
  })

  describe('Qualifying (Single Qualifying Result & Ties)', () => {
    it('handles drivers with only 1 qualifying session based on minStarts filter', () => {
      const mockQualRaces: RawQualifyingRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'R1',
          date: '2026-03-01',
          QualifyingResults: [
            {
              number: '87',
              position: '1', // Bearman pole on sole start
              Driver: driverBearman,
              Constructor: ferrariConstructor,
            },
            {
              number: '16',
              position: '2',
              Driver: driverLeclerc,
              Constructor: ferrariConstructor,
            },
          ],
        },
        {
          season: '2026',
          round: '2',
          raceName: 'R2',
          date: '2026-03-08',
          QualifyingResults: [
            {
              number: '16',
              position: '1',
              Driver: driverLeclerc,
              Constructor: ferrariConstructor,
            },
          ],
        },
        {
          season: '2026',
          round: '3',
          raceName: 'R3',
          date: '2026-03-15',
          QualifyingResults: [
            {
              number: '16',
              position: '3',
              Driver: driverLeclerc,
              Constructor: ferrariConstructor,
            },
          ],
        },
      ]

      // When minStarts = 3, Bearman (1 session) must NOT appear in average quali
      const resultWith3 = computeQualifying(mockQualRaces, 3)
      expect(resultWith3.topAvgQuali.some((d) => d.driverId === 'bearman')).toBe(false)
      expect(resultWith3.topAvgQuali[0].driverId).toBe('leclerc')

      // But Bearman DOES appear in pole count
      expect(resultWith3.topPoles.some((p) => p.driverId === 'bearman')).toBe(true)
    })

    it('breaks ties cleanly by number of sessions', () => {
      const mockQualRaces: RawQualifyingRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'R1',
          date: '2026-03-01',
          QualifyingResults: [
            { number: '16', position: '2', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '44', position: '2', Driver: driverHamilton, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '2',
          raceName: 'R2',
          date: '2026-03-08',
          QualifyingResults: [
            { number: '16', position: '2', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '44', position: '2', Driver: driverHamilton, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '3',
          raceName: 'R3',
          date: '2026-03-15',
          QualifyingResults: [
            { number: '16', position: '2', Driver: driverLeclerc, Constructor: ferrariConstructor },
          ],
        },
      ]

      // Leclerc: avg 2.0 (3 sessions). Hamilton: avg 2.0 (2 sessions).
      // With minStarts = 1, both have avg 2.0, Leclerc ranks higher because of 3 sessions vs 2.
      const result = computeQualifying(mockQualRaces, 1)
      expect(result.topAvgQuali[0].driverId).toBe('leclerc')
      expect(result.topAvgQuali[1].driverId).toBe('hamilton')
    })
  })

  describe('Teammates (Mid-Season Driver Change Fixture)', () => {
    it('compares only the two drivers with the most starts when a team has 3 drivers', () => {
      // Ferrari has Leclerc (3 starts), Hamilton (2 starts), Bearman (1 start)
      const mockRaces: RawRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'R1',
          date: '2026-03-01',
          Results: [
            { number: '16', position: '1', positionText: '1', points: '25', grid: '1', laps: '50', status: 'Finished', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '44', position: '2', positionText: '2', points: '18', grid: '2', laps: '50', status: 'Finished', Driver: driverHamilton, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '2',
          raceName: 'R2',
          date: '2026-03-08',
          Results: [
            { number: '16', position: '1', positionText: '1', points: '25', grid: '1', laps: '50', status: 'Finished', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '87', position: '7', positionText: '7', points: '6', grid: '11', laps: '50', status: 'Finished', Driver: driverBearman, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '3',
          raceName: 'R3',
          date: '2026-03-15',
          Results: [
            { number: '16', position: '3', positionText: '3', points: '15', grid: '3', laps: '50', status: 'Finished', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '44', position: '1', positionText: '1', points: '25', grid: '2', laps: '50', status: 'Finished', Driver: driverHamilton, Constructor: ferrariConstructor },
          ],
        },
      ]

      const mockQual: RawQualifyingRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'R1',
          date: '2026-03-01',
          QualifyingResults: [
            { number: '16', position: '1', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '44', position: '2', Driver: driverHamilton, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '2',
          raceName: 'R2',
          date: '2026-03-08',
          QualifyingResults: [
            { number: '16', position: '1', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '87', position: '11', Driver: driverBearman, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '3',
          raceName: 'R3',
          date: '2026-03-15',
          QualifyingResults: [
            { number: '16', position: '3', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '44', position: '2', Driver: driverHamilton, Constructor: ferrariConstructor },
          ],
        },
      ]

      const comparison = computeTeammates(mockRaces, mockQual)
      expect(comparison.length).toBe(1)
      const ferrari = comparison[0]

      // Mid-season change: selected pair must be Leclerc & Hamilton (most starts), excluding Bearman
      expect(ferrari.driver1.driverId).toBe('leclerc')
      expect(ferrari.driver2.driverId).toBe('hamilton')

      // Shared rounds = rounds 1 & 3 = 2 rounds
      expect(ferrari.sharedRounds).toBe(2)

      // Quali H2H: Round 1 Leclerc (1 vs 2), Round 3 Hamilton (2 vs 3) -> 1 - 1
      expect(ferrari.qualiH2H).toEqual({ driver1Wins: 1, driver2Wins: 1, total: 2 })

      // Race H2H: Round 1 Leclerc ahead, Round 3 Hamilton ahead -> 1 - 1
      expect(ferrari.raceH2H).toEqual({ driver1Wins: 1, driver2Wins: 1, total: 2 })
    })
  })

  describe('Streaks (Active Consecutive Points & Classified Finishes)', () => {
    it('computes current active consecutive streaks and stops at DNF or 0 points', () => {
      const mockRaces: RawRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'R1',
          date: '2026-03-01',
          Results: [
            { number: '1', position: '1', positionText: '1', points: '25', grid: '1', laps: '50', status: 'Finished', Driver: driverVerstappen, Constructor: redBullConstructor },
            { number: '16', position: '15', positionText: '15', points: '0', grid: '5', laps: '50', status: 'Finished', Driver: driverLeclerc, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '2',
          raceName: 'R2',
          date: '2026-03-08',
          Results: [
            { number: '1', position: '2', positionText: '2', points: '18', grid: '2', laps: '50', status: 'Finished', Driver: driverVerstappen, Constructor: redBullConstructor },
            { number: '16', position: '20', positionText: 'R', points: '0', grid: '4', laps: '10', status: 'Retired', Driver: driverLeclerc, Constructor: ferrariConstructor },
          ],
        },
        {
          season: '2026',
          round: '3',
          raceName: 'R3',
          date: '2026-03-15',
          Results: [
            { number: '1', position: '1', positionText: '1', points: '25', grid: '1', laps: '50', status: 'Finished', Driver: driverVerstappen, Constructor: redBullConstructor },
            { number: '16', position: '3', positionText: '3', points: '15', grid: '3', laps: '50', status: 'Finished', Driver: driverLeclerc, Constructor: ferrariConstructor },
          ],
        },
      ]

      const streaks = computeStreaks(mockRaces)

      // Verstappen finished all 3 in points -> streak 3
      const verPoints = streaks.pointsStreaks.find((s) => s.driverId === 'verstappen')
      expect(verPoints?.streak).toBe(3)

      const verFinish = streaks.classifiedStreaks.find((s) => s.driverId === 'verstappen')
      expect(verFinish?.streak).toBe(3)

      // Leclerc: Round 3 had 15 pts, but Round 2 was DNF with 0 pts -> current streak is 1
      const lecPoints = streaks.pointsStreaks.find((s) => s.driverId === 'leclerc')
      expect(lecPoints?.streak).toBe(1)

      const lecFinish = streaks.classifiedStreaks.find((s) => s.driverId === 'leclerc')
      expect(lecFinish?.streak).toBe(1)
    })
  })

  describe('Spotlight (Improvement Formula & Sparkline Data)', () => {
    it('selects the driver with largest improvement between last 5 and previous 5 races', () => {
      // Create 10 rounds where Hamilton improves dramatically from P15 to P2
      const rounds: RawRace[] = []
      for (let i = 1; i <= 10; i++) {
        // Prev 5 (rounds 1-5): finishes 15, 14, 16, 15, 15 (avg = 15.0)
        // Last 5 (rounds 6-10): finishes 2, 1, 2, 3, 2 (avg = 2.0)
        const pos = i <= 5 ? 15 : 2
        rounds.push({
          season: '2026',
          round: String(i),
          raceName: `Round ${i}`,
          date: '2026-03-01',
          Results: [
            {
              number: '44',
              position: String(pos),
              positionText: String(pos),
              points: pos <= 10 ? '10' : '0',
              grid: String(pos),
              laps: '50',
              status: 'Finished',
              Driver: driverHamilton,
              Constructor: ferrariConstructor,
            },
          ],
        })
      }

      const spotlight = computeSpotlight(rounds, [driverHamilton])
      expect(spotlight).not.toBeNull()
      expect(spotlight?.driverId).toBe('hamilton')
      expect(spotlight?.avgLast5).toBe(2)
      expect(spotlight?.avgPrev5).toBe(15)
      expect(spotlight?.improvement).toBe(13)
      expect(spotlight?.history.length).toBe(10)
      expect(spotlight?.reasonSentence).toContain('improved average finishing position from 15 to 2')
    })
  })

  describe('Grid Facts (Ages, Nationalities, Next Birthday)', () => {
    it('computes exact age in years and months and identifies next birthday', () => {
      const fixedToday = new Date('2026-10-12T00:00:00Z')
      const drivers = [driverHamilton, driverLeclerc, driverBearman]
      const races: RawRace[] = [
        {
          season: '2026',
          round: '1',
          raceName: 'R1',
          date: '2026-03-01',
          Results: [
            { number: '44', position: '1', positionText: '1', points: '25', grid: '1', laps: '50', status: 'Finished', Driver: driverHamilton, Constructor: ferrariConstructor },
            { number: '16', position: '2', positionText: '2', points: '18', grid: '2', laps: '50', status: 'Finished', Driver: driverLeclerc, Constructor: ferrariConstructor },
            { number: '87', position: '3', positionText: '3', points: '15', grid: '3', laps: '50', status: 'Finished', Driver: driverBearman, Constructor: ferrariConstructor },
          ],
        },
      ]

      const facts = computeGridFacts(drivers, races, fixedToday)

      // Oldest: Hamilton (born 1985-01-07) -> in Oct 2026 = 41y 9m
      expect(facts.oldestDriver?.driverId).toBe('hamilton')
      expect(facts.oldestDriver?.ageYears).toBe(41)

      // Youngest: Bearman (born 2005-05-08) -> in Oct 2026 = 21y 5m
      expect(facts.youngestDriver?.driverId).toBe('bearman')
      expect(facts.youngestDriver?.ageYears).toBe(21)

      // Nationalities: British and Monegasque = 2
      expect(facts.nationalitiesCount).toBe(2)

      // Next birthday: Leclerc is on Oct 16 (4 days from Oct 12), turning 29
      expect(facts.nextBirthday?.driverId).toBe('leclerc')
      expect(facts.nextBirthday?.turningAge).toBe(29)
      expect(facts.nextBirthday?.dateString).toBe('Oct 16')
    })
  })
})
