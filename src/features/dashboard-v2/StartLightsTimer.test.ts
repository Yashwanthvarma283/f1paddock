import { describe, it, expect } from 'vitest'
import {
  DRAW_DURATION_MS,
  HOLD_DRAWN_MS,
  ERASE_DURATION_MS,
  HOLD_EMPTY_MS,
  getRingCycleDurationMs,
  LIGHT_STEP_DURATION_MS,
  ALL_LIT_HOLD_MS,
  ALL_OFF_PAUSE_MS,
  getGantryCycleDurationMs,
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

  it('has exact required gantry timing constants', () => {
    expect(LIGHT_STEP_DURATION_MS).toBe(1000)
    expect(ALL_LIT_HOLD_MS).toBe(3000)
    expect(ALL_OFF_PAUSE_MS).toBe(1000)
  })

  it('calculates gantry cycle duration for N non-complete lights', () => {
    // 5 lights: (5 - 1) * 1000 + 3000 + 1000 = 8000ms (8s)
    expect(getGantryCycleDurationMs(5)).toBe(8000)
    // 4 lights: (4 - 1) * 1000 + 3000 + 1000 = 7000ms (7s)
    expect(getGantryCycleDurationMs(4)).toBe(7000)
    // 3 lights: (3 - 1) * 1000 + 3000 + 1000 = 6000ms (6s)
    expect(getGantryCycleDurationMs(3)).toBe(6000)
    // 2 lights: (2 - 1) * 1000 + 3000 + 1000 = 5000ms (5s)
    expect(getGantryCycleDurationMs(2)).toBe(5000)
    // 1 light: (1 - 1) * 1000 + 3000 + 1000 = 4000ms (4s)
    expect(getGantryCycleDurationMs(1)).toBe(4000)
    // 0 lights: 0ms
    expect(getGantryCycleDurationMs(0)).toBe(0)
  })
})
