/**
 * Formula 1 Domain Entities and API Contracts.
 * Adheres to ISP (Interface Segregation Principle): fine-grained,
 * targeted interfaces so components only consume what they require.
 */

export interface F1Location {
  lat: string
  long: string
  locality: string
  country: string
}

export interface F1Circuit {
  circuitId: string
  url: string
  circuitName: string
  Location: F1Location
}

export interface F1RawSession {
  date: string
  time?: string
}

export interface F1Race {
  season: string
  round: string
  url: string
  raceName: string
  Circuit: F1Circuit
  date: string // Race date YYYY-MM-DD
  time?: string // Race time HH:MM:SSZ
  FirstPractice?: F1RawSession
  SecondPractice?: F1RawSession
  ThirdPractice?: F1RawSession
  Qualifying?: F1RawSession
  Sprint?: F1RawSession
  SprintQualifying?: F1RawSession
}

export type SessionTypeCode = 'FP1' | 'FP2' | 'FP3' | 'QUAL' | 'SQ' | 'SPRINT' | 'RACE'

export interface WeekendSession {
  id: string
  type: SessionTypeCode
  title: string
  startTimeIso: string
  endTimeIso: string // Estimated or real end
  isLive: boolean
  isFinished: boolean
  isUpcoming: boolean
}

export interface F1Driver {
  driverId: string
  permanentNumber?: string
  code?: string
  givenName: string
  familyName: string
  dateOfBirth?: string
  nationality: string
}

export interface F1Constructor {
  constructorId: string
  name: string
  nationality: string
  url?: string
}

export interface F1ResultItem {
  number: string
  position: string
  positionText: string
  points: string
  grid: string
  laps: string
  status: string
  Time?: {
    millis?: string
    time: string
  }
  FastestLap?: {
    rank: string
    lap: string
    Time: {
      time: string
    }
  }
  Driver: F1Driver
  Constructor: F1Constructor
}

export interface LastRaceResultPayload {
  season: string
  round: string
  raceName: string
  Circuit: F1Circuit
  date: string
  time?: string
  results: F1ResultItem[]
  winner?: F1ResultItem
  podium: F1ResultItem[]
  fastestLap?: F1ResultItem
}

export interface RaceResultPayload {
  season: string
  round: string
  raceName: string
  Circuit: F1Circuit
  date: string
  time?: string
  Results: F1ResultItem[]
}

export interface DriverStandingItem {
  position: number
  points: number
  wins: number
  driver: F1Driver
  constructor: F1Constructor
  gapToLeader: number
}

export interface ConstructorStandingItem {
  position: number
  points: number
  wins: number
  constructor: F1Constructor
  gapToLeader: number
}

export interface LiveSessionStatus {
  isLive: boolean
  isReplay: boolean
  activeSessionName?: string
  sessionKey?: number
  meetingKey?: number
}
