import { F1Race, WeekendSession, SessionTypeCode } from './types'

export interface CountdownState {
  totalSeconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

/**
 * Service for calculating session timetables, upcoming sessions,
 * and countdown intervals.
 * Adheres to SRP: pure domain calculations on F1 race & session schedules.
 */
export class SessionService {
  /**
   * Combines date string (YYYY-MM-DD) and time string (HH:MM:SSZ) into valid ISO timestamp.
   */
  static parseSessionIso(dateStr?: string, timeStr?: string): string | null {
    if (!dateStr) return null
    if (!timeStr) {
      // Default to 12:00:00Z if time is omitted
      return `${dateStr}T12:00:00Z`
    }
    const cleanTime = timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`
    return `${dateStr}T${cleanTime}`
  }

  /**
   * Extracts ordered weekend sessions from a race object.
   */
  static extractWeekendSessions(race: F1Race, referenceTime: Date = new Date()): WeekendSession[] {
    const rawSessions: { type: SessionTypeCode; title: string; date?: string; time?: string; durationHours: number }[] = []

    // 1. FP1
    if (race.FirstPractice) {
      rawSessions.push({
        type: 'FP1',
        title: 'Practice 1',
        date: race.FirstPractice.date,
        time: race.FirstPractice.time,
        durationHours: 1,
      })
    }

    // Sprint Qualifying (if sprint weekend)
    if (race.SprintQualifying) {
      rawSessions.push({
        type: 'SQ',
        title: 'Sprint Qualifying',
        date: race.SprintQualifying.date,
        time: race.SprintQualifying.time,
        durationHours: 0.75,
      })
    } else if (race.SecondPractice) {
      // FP2 (standard weekend)
      rawSessions.push({
        type: 'FP2',
        title: 'Practice 2',
        date: race.SecondPractice.date,
        time: race.SecondPractice.time,
        durationHours: 1,
      })
    }

    // Sprint (if sprint weekend)
    if (race.Sprint) {
      rawSessions.push({
        type: 'SPRINT',
        title: 'Sprint',
        date: race.Sprint.date,
        time: race.Sprint.time,
        durationHours: 1,
      })
    } else if (race.ThirdPractice) {
      // FP3 (standard weekend)
      rawSessions.push({
        type: 'FP3',
        title: 'Practice 3',
        date: race.ThirdPractice.date,
        time: race.ThirdPractice.time,
        durationHours: 1,
      })
    }

    // Qualifying
    if (race.Qualifying) {
      rawSessions.push({
        type: 'QUAL',
        title: 'Qualifying',
        date: race.Qualifying.date,
        time: race.Qualifying.time,
        durationHours: 1,
      })
    }

    // Grand Prix Race
    rawSessions.push({
      type: 'RACE',
      title: 'Grand Prix',
      date: race.date,
      time: race.time,
      durationHours: 2,
    })

    const refMs = referenceTime.getTime()

    return rawSessions
      .map((s, index) => {
        const startIso = SessionService.parseSessionIso(s.date, s.time) || ''
        const startMs = new Date(startIso).getTime()
        const endMs = startMs + s.durationHours * 60 * 60 * 1000
        const endIso = new Date(endMs).toISOString()

        const isFinished = refMs >= endMs
        const isLive = refMs >= startMs && refMs < endMs
        const isUpcoming = refMs < startMs

        return {
          id: `${race.round}_${s.type}_${index}`,
          type: s.type,
          title: s.title,
          startTimeIso: startIso,
          endTimeIso: endIso,
          isLive,
          isFinished,
          isUpcoming,
        }
      })
      .sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime())
  }

  /**
   * Finds the closest next upcoming session or current live session in the race weekend.
   */
  static getNextUpcomingSession(
    sessions: WeekendSession[],
    referenceTime: Date = new Date()
  ): WeekendSession | null {
    const refMs = referenceTime.getTime()

    // 1. If any session is currently live, that takes priority
    const liveSession = sessions.find((s) => s.isLive)
    if (liveSession) return liveSession

    // 2. Otherwise find the earliest upcoming session
    const upcoming = sessions.filter((s) => new Date(s.startTimeIso).getTime() > refMs)
    return upcoming.length > 0 ? upcoming[0] : (sessions[sessions.length - 1] || null)
  }

  /**
   * Computes days, hours, minutes, seconds breakdown from target ISO string.
   */
  static calculateCountdown(targetIso: string, referenceTime: Date = new Date()): CountdownState {
    const targetMs = new Date(targetIso).getTime()
    const nowMs = referenceTime.getTime()
    const diffMs = targetMs - nowMs

    if (isNaN(diffMs) || diffMs <= 0) {
      return {
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      }
    }

    const totalSeconds = Math.floor(diffMs / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return {
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
    }
  }

  /**
   * Finds the upcoming race round from a list of races based on current date and last completed round.
   */
  static findNextRace(
    races: F1Race[],
    referenceTime: Date = new Date(),
    lastCompletedRound?: number | string
  ): F1Race | null {
    if (!races || races.length === 0) return null

    const completedRoundNum =
      lastCompletedRound !== undefined && lastCompletedRound !== null
        ? Number(lastCompletedRound)
        : null
    const refMs = referenceTime.getTime()

    for (const race of races) {
      const raceRoundNum = Number(race.round)

      // If official results show this round is already completed, immediately advance
      if (completedRoundNum !== null && !isNaN(completedRoundNum) && raceRoundNum <= completedRoundNum) {
        continue
      }

      // Check if race has finished based on time (standard GP duration is 2 hours)
      const raceIso = SessionService.parseSessionIso(race.date, race.time)
      if (raceIso) {
        const raceTimeMs = new Date(raceIso).getTime()
        const raceEndMs = raceTimeMs + 2 * 60 * 60 * 1000
        if (refMs < raceEndMs) {
          return race
        }
      }
    }

    // Fallback to last race if season ended
    return races[races.length - 1]
  }
}
