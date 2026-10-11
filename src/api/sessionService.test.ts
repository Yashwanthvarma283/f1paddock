import { describe, it, expect } from 'vitest'
import { SessionService } from './sessionService'
import { F1Race } from './types'

describe('SessionService', () => {
  const mockSprintRace: F1Race = {
    season: '2026',
    round: '17',
    url: '',
    raceName: 'Singapore Grand Prix',
    Circuit: {
      circuitId: 'marina_bay',
      url: '',
      circuitName: 'Marina Bay Street Circuit',
      Location: { lat: '1.29', long: '103.86', locality: 'Marina Bay', country: 'Singapore' },
    },
    date: '2026-10-11',
    time: '12:00:00Z',
    FirstPractice: { date: '2026-10-09', time: '08:30:00Z' },
    SprintQualifying: { date: '2026-10-09', time: '12:30:00Z' },
    Sprint: { date: '2026-10-10', time: '09:00:00Z' },
    Qualifying: { date: '2026-10-10', time: '13:00:00Z' },
  }

  it('correctly extracts sessions for a sprint weekend in chronological order', () => {
    const sessions = SessionService.extractWeekendSessions(mockSprintRace)
    expect(sessions.length).toBe(5)
    expect(sessions.map((s) => s.type)).toEqual(['FP1', 'SQ', 'SPRINT', 'QUAL', 'RACE'])
  })

  it('determines the next upcoming session correctly based on reference time', () => {
    // 2026-10-08: Before weekend starts -> Next session should be FP1
    const beforeWeekend = new Date('2026-10-08T12:00:00Z')
    const sessions = SessionService.extractWeekendSessions(mockSprintRace, beforeWeekend)
    const nextSession = SessionService.getNextUpcomingSession(sessions, beforeWeekend)
    expect(nextSession?.type).toBe('FP1')

    // 2026-10-09 10:00Z: After FP1, before Sprint Qualifying -> Next session should be SQ
    const midFriday = new Date('2026-10-09T10:00:00Z')
    const sessionsFriday = SessionService.extractWeekendSessions(mockSprintRace, midFriday)
    const nextAfterFp1 = SessionService.getNextUpcomingSession(sessionsFriday, midFriday)
    expect(nextAfterFp1?.type).toBe('SQ')
  })

  it('calculates countdown deltas correctly', () => {
    const now = new Date('2026-10-07T12:00:00Z')
    const target = '2026-10-09T14:30:45Z' // 2 days, 2 hours, 30 mins, 45 secs
    const countdown = SessionService.calculateCountdown(target, now)

    expect(countdown.isExpired).toBe(false)
    expect(countdown.days).toBe(2)
    expect(countdown.hours).toBe(2)
    expect(countdown.minutes).toBe(30)
    expect(countdown.seconds).toBe(45)
  })

  it('identifies an expired session countdown', () => {
    const now = new Date('2026-10-10T12:00:00Z')
    const target = '2026-10-09T12:00:00Z'
    const countdown = SessionService.calculateCountdown(target, now)
    expect(countdown.isExpired).toBe(true)
    expect(countdown.totalSeconds).toBe(0)
  })

  it('immediately advances next race when a round has completed', () => {
    const races: F1Race[] = [
      {
        ...mockSprintRace,
        round: '16',
        raceName: 'Italian Grand Prix',
        date: '2026-09-06',
        time: '13:00:00Z',
      },
      {
        ...mockSprintRace,
        round: '17',
        raceName: 'Singapore Grand Prix',
        date: '2026-10-11',
        time: '12:00:00Z',
      },
      {
        ...mockSprintRace,
        round: '18',
        raceName: 'United States Grand Prix',
        date: '2026-10-25',
        time: '19:00:00Z',
      },
    ]

    // When round 16 was officially completed:
    const next1 = SessionService.findNextRace(races, new Date('2026-09-06T16:00:00Z'), '16')
    expect(next1?.round).toBe('17')
    expect(next1?.raceName).toBe('Singapore Grand Prix')

    // When round 17 was officially completed immediately after race:
    const next2 = SessionService.findNextRace(races, new Date('2026-10-11T14:30:00Z'), 17)
    expect(next2?.round).toBe('18')
    expect(next2?.raceName).toBe('United States Grand Prix')
  })
})
