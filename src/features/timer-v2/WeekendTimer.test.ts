import { describe, it, expect } from 'vitest'
import { deriveTimerState, formatSessionTime, formatSessionWeekday } from './helpers'
import { FIXTURE_SCENARIOS } from './fixtures'

describe('timer-v2 helpers and state derivation', () => {
  it('correctly identifies State 1: > 24 hours', () => {
    const scenario = FIXTURE_SCENARIOS.gt24h
    const state = deriveTimerState(scenario.sessions, scenario.clockIso)
    expect(state.stateMode).toBe('gt24h')
    expect(state.days).toBeGreaterThanOrEqual(1)
    expect(state.statusHeading).toBe('NEXT: PRACTICE 1')
  })

  it('correctly identifies State 2: < 24 hours', () => {
    const scenario = FIXTURE_SCENARIOS.lt24h
    const state = deriveTimerState(scenario.sessions, scenario.clockIso)
    expect(state.stateMode).toBe('lt24h')
    expect(state.days).toBe(0)
    expect(state.hours).toBeGreaterThan(0)
    expect(state.statusHeading).toBe('NEXT: PRACTICE 1')
  })

  it('correctly identifies State 3: < 1 hour', () => {
    const scenario = FIXTURE_SCENARIOS.lt1h
    const state = deriveTimerState(scenario.sessions, scenario.clockIso)
    expect(state.stateMode).toBe('lt1h')
    expect(state.days).toBe(0)
    expect(state.hours).toBe(0)
    expect(state.minutes).toBe(42)
    expect(state.seconds).toBe(18)
    expect(state.statusHeading).toBe('NEXT: QUALIFYING')
  })

  it('correctly identifies State 4: < 1 minute', () => {
    const scenario = FIXTURE_SCENARIOS.lt1m
    const state = deriveTimerState(scenario.sessions, scenario.clockIso)
    expect(state.stateMode).toBe('lt1m')
    expect(state.days).toBe(0)
    expect(state.hours).toBe(0)
    expect(state.minutes).toBe(0)
    expect(state.seconds).toBe(48)
    expect(state.statusHeading).toBe('NEXT: RACE')
  })

  it('correctly identifies State 5: Running Now', () => {
    const scenario = FIXTURE_SCENARIOS.running
    const state = deriveTimerState(scenario.sessions, scenario.clockIso)
    expect(state.stateMode).toBe('running')
    expect(state.isLive).toBe(true)
    expect(state.activeSession?.id).toBe('fp2')
    expect(state.followingSession?.id).toBe('fp3')
    expect(state.statusHeading).toBe('NOW: PRACTICE 2')
  })

  it('correctly identifies State 6: Weekend Complete', () => {
    const scenario = FIXTURE_SCENARIOS.completed
    const state = deriveTimerState(scenario.sessions, scenario.clockIso)
    expect(state.stateMode).toBe('completed')
    expect(state.statusHeading).toBe('Weekend complete')
    expect(state.isExpired).toBe(true)
  })

  it('formats time in 24h and 12h modes', () => {
    const iso = '2026-10-16T17:30:00Z'
    const t24 = formatSessionTime(iso, '24h')
    const t12 = formatSessionTime(iso, '12h')
    expect(typeof t24).toBe('string')
    expect(typeof t12).toBe('string')
  })

  it('formats session weekday', () => {
    const iso = '2026-10-16T17:30:00Z'
    expect(formatSessionWeekday(iso)).toBe('FRI')
  })
})
