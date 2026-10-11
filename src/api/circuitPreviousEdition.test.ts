import { describe, it, expect } from 'vitest'
import { selectPreviousEdition } from './circuitPreviousEdition'

describe('selectPreviousEdition', () => {
  it('selects the most recent season strictly before the current one', () => {
    const mockRaces = [
      {
        season: '2023',
        round: '15',
        raceName: 'Singapore Grand Prix',
        Results: [
          {
            laps: '62',
            Driver: { givenName: 'Carlos', familyName: 'Sainz', code: 'SAI' },
            Constructor: { name: 'Ferrari' },
          },
        ],
      },
      {
        season: '2024',
        round: '18',
        raceName: 'Singapore Grand Prix',
        Results: [
          {
            laps: '62',
            Driver: { givenName: 'Lando', familyName: 'Norris', code: 'NOR' },
            Constructor: { name: 'McLaren' },
          },
        ],
      },
      {
        season: '2025',
        round: '18',
        raceName: 'Singapore Grand Prix',
        Results: [
          {
            laps: '62',
            Driver: { givenName: 'George', familyName: 'Russell', code: 'RUS' },
            Constructor: { name: 'Mercedes' },
          },
        ],
      },
      {
        season: '2026',
        round: '18',
        raceName: 'Singapore Grand Prix',
        Results: [
          {
            laps: '62',
            Driver: { givenName: 'Max', familyName: 'Verstappen', code: 'VER' },
            Constructor: { name: 'Red Bull' },
          },
        ],
      },
    ]

    // Current season is 2026 -> should pick 2025
    const selected2026 = selectPreviousEdition(mockRaces, 2026)
    expect(selected2026).not.toBeNull()
    expect(selected2026?.season).toBe('2025')
    expect(selected2026?.winnerName).toBe('George Russell')
    expect(selected2026?.winnerCode).toBe('RUS')
    expect(selected2026?.constructorName).toBe('Mercedes')
    expect(selected2026?.laps).toBe('62')

    // Current season is 2025 -> should pick 2024
    const selected2025 = selectPreviousEdition(mockRaces, 2025)
    expect(selected2025?.season).toBe('2024')
    expect(selected2025?.winnerName).toBe('Lando Norris')
  })

  it('returns null for a circuit with no previous race before current season', () => {
    // Brand new circuit or no prior races
    const newCircuitRaces = [
      {
        season: '2026',
        round: '5',
        raceName: 'Madrid Grand Prix',
        Results: [
          {
            laps: '66',
            Driver: { givenName: 'Carlos', familyName: 'Sainz', code: 'SAI' },
            Constructor: { name: 'Williams' },
          },
        ],
      },
    ]

    const result = selectPreviousEdition(newCircuitRaces, 2026)
    expect(result).toBeNull()

    // Completely empty results
    expect(selectPreviousEdition([], 2026)).toBeNull()
    expect(selectPreviousEdition(null, 2026)).toBeNull()
    expect(selectPreviousEdition(undefined, 2026)).toBeNull()
  })

  it('handles races out of chronological order properly', () => {
    const unsortedRaces = [
      {
        season: '2024',
        round: '10',
        raceName: 'Test GP',
        Results: [{ laps: '50', Driver: { givenName: 'Driver', familyName: '2024' } }],
      },
      {
        season: '2022',
        round: '10',
        raceName: 'Test GP',
        Results: [{ laps: '50', Driver: { givenName: 'Driver', familyName: '2022' } }],
      },
      {
        season: '2023',
        round: '10',
        raceName: 'Test GP',
        Results: [{ laps: '50', Driver: { givenName: 'Driver', familyName: '2023' } }],
      },
    ]

    const selected = selectPreviousEdition(unsortedRaces, 2025)
    expect(selected?.season).toBe('2024')
    expect(selected?.winnerName).toBe('Driver 2024')
  })
})
