import { describe, it, expect } from 'vitest'
import {
  detectBrowserTimezone,
  getTimezoneAbbreviation,
  getTimezoneOffsetString,
  formatTimeInZone,
  formatDateInZone,
  formatWeekdayInZone,
  formatWeekendRange,
  IANA_TIMEZONES,
} from './timezone'

describe('Timezone utility module', () => {
  it('detects a valid default timezone string', () => {
    const tz = detectBrowserTimezone()
    expect(typeof tz).toBe('string')
    expect(tz.length).toBeGreaterThan(0)
  })

  it('correctly retrieves timezone abbreviations', () => {
    // Winter (January) in London is GMT
    const winterDate = new Date('2026-01-15T12:00:00Z')
    const londonWinter = getTimezoneAbbreviation('Europe/London', winterDate)
    expect(londonWinter).toBe('GMT')

    // Summer (July) in London is BST
    const summerDate = new Date('2026-07-15T12:00:00Z')
    const londonSummer = getTimezoneAbbreviation('Europe/London', summerDate)
    expect(londonSummer).toBe('BST')

    // UTC
    expect(getTimezoneAbbreviation('UTC', winterDate)).toBe('UTC')
  })

  it('correctly retrieves timezone offset string', () => {
    const winterDate = new Date('2026-01-15T12:00:00Z')
    expect(getTimezoneOffsetString('UTC', winterDate)).toBe('UTC')
    expect(getTimezoneOffsetString('Asia/Singapore', winterDate)).toBe('UTC+08:00')
  })

  it('formats time in 24h and 12h modes correctly', () => {
    // 14:30 UTC
    const date = new Date('2026-10-09T14:30:00Z')

    // UTC 24h
    const utc24 = formatTimeInZone(date, 'UTC', true)
    expect(utc24).toBe('14:30')

    // UTC 12h
    const utc12 = formatTimeInZone(date, 'UTC', false)
    expect(utc12).toBe('02:30 PM')

    // Singapore is UTC+8: 14:30 + 8h = 22:30
    const sg24 = formatTimeInZone(date, 'Asia/Singapore', true)
    expect(sg24).toBe('22:30')

    const sg12 = formatTimeInZone(date, 'Asia/Singapore', false)
    expect(sg12).toBe('10:30 PM')
  })

  it('formats dates in given timezones', () => {
    // 2026-10-09 23:30 UTC -> in Singapore (+8h) it is 2026-10-10
    const date = new Date('2026-10-09T23:30:00Z')

    const dateInUTC = formatDateInZone(date, 'UTC')
    expect(dateInUTC).toContain('9 Oct')

    const dateInSG = formatDateInZone(date, 'Asia/Singapore')
    expect(dateInSG).toContain('10 Oct')
  })

  it('handles invalid dates gracefully without throwing', () => {
    expect(formatTimeInZone('invalid-date', 'UTC', true)).toBe('--:--')
    expect(formatDateInZone('invalid-date', 'UTC')).toBe('')
    expect(formatWeekdayInZone('invalid-date', 'UTC')).toBe('')
    expect(formatWeekendRange('invalid', 'invalid', 'UTC')).toBe('')
  })

  it('formats weekend date range correctly', () => {
    const range = formatWeekendRange('2026-10-09T08:00:00Z', '2026-10-11T14:00:00Z', 'UTC')
    expect(range).toContain('09 - 11 Oct')

    const crossMonthRange = formatWeekendRange('2026-10-30T18:00:00Z', '2026-11-01T20:00:00Z', 'UTC')
    expect(crossMonthRange).toContain('30 Oct - 01 Nov')
  })

  it('verifies curated IANA timezone list contains essential Grand Prix regions', () => {
    expect(IANA_TIMEZONES.length).toBeGreaterThan(15)
    const zones = IANA_TIMEZONES.map((t) => t.value)
    expect(zones).toContain('UTC')
    expect(zones).toContain('Europe/London')
    expect(zones).toContain('Asia/Singapore')
    expect(zones).toContain('America/Chicago')
    expect(zones).toContain('America/Sao_Paulo')
  })
})
