import { describe, it, expect } from 'vitest'
import { getCircuitInfo, CIRCUITS, sanitizeRaceName, getRealCircuitGeometry } from './circuits'

describe('circuits module', () => {
  it('correctly maps all modern championship circuit aliases and canonical IDs', () => {
    const pairs = [
      ['americas', 'austin'],
      ['austin', 'austin'],
      ['rodriguez', 'mexico_city'],
      ['mexico_city', 'mexico_city'],
      ['vegas', 'las_vegas'],
      ['las_vegas', 'las_vegas'],
      ['losail', 'lusail'],
      ['lusail', 'lusail'],
      ['albert_park', 'melbourne'],
      ['melbourne', 'melbourne'],
      ['catalunya', 'barcelona'],
      ['barcelona', 'barcelona'],
      ['villeneuve', 'montreal'],
      ['montreal', 'montreal'],
      ['red_bull_ring', 'spielberg'],
      ['spielberg', 'spielberg'],
      ['hungaroring', 'budapest'],
      ['budapest', 'budapest'],
      ['sakhir', 'sakhir'],
      ['bahrain', 'sakhir'],
      ['spa', 'spa'],
      ['spa_francorchamps', 'spa'],
      ['monaco', 'monaco'],
      ['monte_carlo', 'monaco'],
      ['madring', 'madrid'],
      ['madrid', 'madrid'],
      ['sepang', 'sepang'],
    ]

    for (const [query] of pairs) {
      const info = getCircuitInfo(query)
      expect(info.id).not.toBe('default_circuit')
      expect(info.turnsData.length).toBeGreaterThanOrEqual(10)
      expect(info.path.length).toBeGreaterThan(50)
      
      const s1 = info.turnsData.filter(t => t.sector === 1).length
      const s2 = info.turnsData.filter(t => t.sector === 2).length
      const s3 = info.turnsData.filter(t => t.sector === 3).length
      expect(s1).toBeGreaterThan(0)
      expect(s2).toBeGreaterThan(0)
      expect(s3).toBeGreaterThan(0)
    }
  })

  it('guarantees fuzzy circuit matching by race/circuit/location name', () => {
    const cota = getCircuitInfo(undefined, 'United States Grand Prix at Circuit of the Americas')
    expect(cota.name).toBe('Circuit of the Americas')
    expect(cota.turns).toBe(20)

    const monaco = getCircuitInfo(undefined, 'Grand Prix de Monaco')
    expect(monaco.location).toBe('Monte Carlo')
    expect(monaco.turns).toBe(19)

    const silverstone = getCircuitInfo(undefined, 'British Grand Prix at Silverstone')
    expect(silverstone.name).toBe('Silverstone Circuit')
    expect(silverstone.turns).toBe(18)
  })

  it('sanitizes race names accurately', () => {
    expect(sanitizeRaceName('Bahrain Grand Prix in Malaysia', 'sepang')).toBe('Malaysian Grand Prix')
    expect(sanitizeRaceName('Italian Grand Prix in Monza')).toBe('Italian Grand Prix')
    expect(sanitizeRaceName('Monaco Grand Prix')).toBe('Monaco Grand Prix')
  })

  it('provides complete real circuit geometry without fallback errors', () => {
    const geom = getRealCircuitGeometry('austin')
    expect(geom.racing_line.length).toBeGreaterThan(100)
    expect(geom.corners.length).toBe(20)
    expect(geom.inner_boundary.length).toBeGreaterThan(10)
    expect(geom.outer_boundary.length).toBeGreaterThan(10)
  })
})
