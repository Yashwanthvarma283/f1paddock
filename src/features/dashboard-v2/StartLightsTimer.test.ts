import { describe, it, expect } from 'vitest'
import {
  DRAW_DURATION_MS,
  HOLD_DRAWN_MS,
  ERASE_DURATION_MS,
  HOLD_EMPTY_MS,
  getRingCycleDurationMs,
} from './timerConstants'

describe('StartLightsTimer constants and loop duration math', () => {
  it('has exact required timing constants', () => {
    expect(DRAW_DURATION_MS).toBe(600)
    expect(HOLD_DRAWN_MS).toBe(400)
    expect(ERASE_DURATION_MS).toBe(600)
    expect(HOLD_EMPTY_MS).toBe(400)
  })

  it('calculates loop duration for 5 non-complete lights (all incomplete)', () => {
    // Formula: (5 * 600) + 400 + (5 * 600) + 400 = 6800ms
    expect(getRingCycleDurationMs(5)).toBe(6800)
  })

  it('calculates loop duration for 3 non-complete lights (2 sessions complete)', () => {
    // Formula: (3 * 600) + 400 + (3 * 600) + 400 = 4400ms
    expect(getRingCycleDurationMs(3)).toBe(4400)
  })

  it('calculates loop duration for 2 non-complete lights (3 sessions complete)', () => {
    // Formula: (2 * 600) + 400 + (2 * 600) + 400 = 3200ms
    expect(getRingCycleDurationMs(2)).toBe(3200)
  })

  it('calculates loop duration for 1 non-complete light (4 sessions complete)', () => {
    // Formula: (1 * 600) + 400 + (1 * 600) + 400 = 2000ms
    expect(getRingCycleDurationMs(1)).toBe(2000)
  })

  it('returns 0 for 0 non-complete lights (weekend complete)', () => {
    expect(getRingCycleDurationMs(0)).toBe(0)
  })
})
