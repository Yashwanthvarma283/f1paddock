/**
 * Pure timezone and date formatting service using standard Intl APIs.
 * Adheres to SRP: exactly one responsibility of handling timezone conversions,
 * DST-accurate formatting, and IANA timezone registry utilities.
 */

export interface TimezoneOption {
  value: string // IANA identifier e.g. 'Asia/Singapore'
  label: string // Display name e.g. 'Singapore (SGT, UTC+8)'
  city: string
  region: string
}

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Returns the short abbreviation for a timezone at a specific point in time (DST-sensitive).
 * Example: 'EDT' during daylight saving, 'EST' during standard time, 'BST' / 'GMT' in London.
 */
export function getTimezoneAbbreviation(timeZone: string, date: Date = new Date()): string {
  if (timeZone === 'UTC') return 'UTC'

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(date)
    const timeZonePart = parts.find((part) => part.type === 'timeZoneName')
    const rawVal = timeZonePart ? timeZonePart.value : timeZone

    // If environment returns generic GMT offset like GMT+1, map common racing zones
    if (rawVal.startsWith('GMT') || rawVal.startsWith('UTC')) {
      const isSummer = date.getUTCMonth() >= 3 && date.getUTCMonth() <= 9
      if (timeZone === 'Europe/London') return isSummer ? 'BST' : 'GMT'
      if (timeZone.startsWith('Europe/')) return isSummer ? 'CEST' : 'CET'
      if (timeZone === 'America/New_York') return isSummer ? 'EDT' : 'EST'
      if (timeZone === 'America/Chicago') return isSummer ? 'CDT' : 'CST'
      if (timeZone === 'Asia/Singapore') return 'SGT'
      if (timeZone === 'Asia/Tokyo') return 'JST'
      if (timeZone === 'Australia/Melbourne') return isSummer ? 'AEST' : 'AEDT'
    }

    return rawVal
  } catch {
    return timeZone
  }
}

/**
 * Returns formatted offset like 'UTC+08:00' or 'UTC-04:00'
 */
export function getTimezoneOffsetString(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    })
    const parts = formatter.formatToParts(date)
    const part = parts.find((p) => p.type === 'timeZoneName')
    if (part) {
      return part.value.replace('GMT', 'UTC')
    }
  } catch {
    // Fallback
  }
  return 'UTC'
}

/**
 * Formats time in 12h or 24h format in the selected timezone.
 * Example 24h: '14:30', 12h: '2:30 PM'
 */
export function formatTimeInZone(
  dateInput: Date | string,
  timeZone: string,
  is24h: boolean = true
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return '--:--'

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: is24h ? 'h23' : 'h12',
    })
    return formatter.format(date)
  } catch {
    return '--:--'
  }
}

/**
 * Formats session date once with Intl.DateTimeFormat.
 * Example: 'Fri 9 Oct'
 */
export function formatDateInZone(
  dateInput: Date | string,
  timeZone: string
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return ''

  try {
    const weekday = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short' }).format(date)
    const day = new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric' }).format(date)
    const month = new Intl.DateTimeFormat('en-GB', { timeZone, month: 'short' }).format(date)
    return `${weekday} ${day} ${month}`
  } catch {
    return ''
  }
}

/**
 * Returns weekday name. Example: 'Friday'
 */
export function formatWeekdayInZone(
  dateInput: Date | string,
  timeZone: string
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return ''

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      weekday: 'short',
    })
    return formatter.format(date)
  } catch {
    return ''
  }
}

/**
 * Formats full race day with weekday, day, month and year.
 * Example: 'Sun 11 Oct 2026'
 */
export function formatFullRaceDate(
  dateInput: Date | string,
  timeZone: string
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return ''

  try {
    const weekday = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short' }).format(date)
    const day = new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric' }).format(date)
    const month = new Intl.DateTimeFormat('en-GB', { timeZone, month: 'short' }).format(date)
    const year = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric' }).format(date)
    return `${weekday} ${day} ${month} ${year}`
  } catch {
    return ''
  }
}

/**
 * Formats full weekend date range from race date (Friday to Sunday).
 * Example: '9-11 Oct'
 */
export function formatWeekendSpan(
  raceDateInput: Date | string,
  timeZone: string
): string {
  const dRace = typeof raceDateInput === 'string' ? new Date(raceDateInput) : raceDateInput
  if (isNaN(dRace.getTime())) return ''

  try {
    const dFri = new Date(dRace.getTime() - 2 * 24 * 60 * 60 * 1000)
    const startDay = new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric' }).format(dFri)
    const endDay = new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric' }).format(dRace)
    const startMonth = new Intl.DateTimeFormat('en-GB', { timeZone, month: 'short' }).format(dFri)
    const endMonth = new Intl.DateTimeFormat('en-GB', { timeZone, month: 'short' }).format(dRace)
    return startMonth === endMonth ? `${startDay}-${endDay} ${endMonth}` : `${startDay} ${startMonth} - ${endDay} ${endMonth}`
  } catch {
    return ''
  }
}

/**
 * Formats full weekend date range from start & end ISO strings.
 * Example: '09 - 11 Oct'
 */
export function formatWeekendRange(
  startIso: string,
  endIso: string,
  timeZone: string
): string {
  const dStart = new Date(startIso)
  const dEnd = new Date(endIso)
  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return ''

  try {
    const startDay = new Intl.DateTimeFormat('en-GB', { timeZone, day: '2-digit' }).format(dStart)
    const endDay = new Intl.DateTimeFormat('en-GB', { timeZone, day: '2-digit' }).format(dEnd)
    const startMonth = new Intl.DateTimeFormat('en-GB', { timeZone, month: 'short' }).format(dStart)
    const endMonth = new Intl.DateTimeFormat('en-GB', { timeZone, month: 'short' }).format(dEnd)
    return startMonth === endMonth ? `${startDay} - ${endDay} ${endMonth}` : `${startDay} ${startMonth} - ${endDay} ${endMonth}`
  } catch {
    return ''
  }
}

/**
 * Curated list of popular IANA timezones covering all Grand Prix locations and major fan regions.
 */
export const IANA_TIMEZONES: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', city: 'UTC', region: 'Global' },
  { value: 'Europe/London', label: 'London (GMT / BST)', city: 'London', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris, Monaco, Milan, Berlin (CET / CEST)', city: 'Paris', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid, Barcelona (CET / CEST)', city: 'Madrid', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam, Zandvoort (CET / CEST)', city: 'Amsterdam', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels, Spa (CET / CEST)', city: 'Brussels', region: 'Europe' },
  { value: 'Europe/Budapest', label: 'Budapest, Hungaroring (CET / CEST)', city: 'Budapest', region: 'Europe' },
  { value: 'Asia/Baku', label: 'Baku (AZT, UTC+4)', city: 'Baku', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Abu Dhabi, Dubai (GST, UTC+4)', city: 'Abu Dhabi', region: 'Middle East' },
  { value: 'Asia/Bahrain', label: 'Sakhir, Manama (AST, UTC+3)', city: 'Bahrain', region: 'Middle East' },
  { value: 'Asia/Qatar', label: 'Lusail, Doha (AST, UTC+3)', city: 'Qatar', region: 'Middle East' },
  { value: 'Asia/Riyadh', label: 'Jeddah, Riyadh (AST, UTC+3)', city: 'Jeddah', region: 'Middle East' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8)', city: 'Singapore', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Suzuka (JST, UTC+9)', city: 'Suzuka', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST, UTC+8)', city: 'Shanghai', region: 'Asia' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur, Sepang (MYT, UTC+8)', city: 'Sepang', region: 'Asia' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST / AEDT)', city: 'Melbourne', region: 'Australia' },
  { value: 'America/New_York', label: 'New York, Miami, Montreal (EST / EDT)', city: 'New York', region: 'Americas' },
  { value: 'America/Chicago', label: 'Austin (COTA) (CST / CDT)', city: 'Austin', region: 'Americas' },
  { value: 'America/Denver', label: 'Denver (MST / MDT)', city: 'Denver', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Las Vegas, Los Angeles (PST / PDT)', city: 'Las Vegas', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST, UTC-6)', city: 'Mexico City', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo, Interlagos (BRT, UTC-3)', city: 'São Paulo', region: 'Americas' },
  { value: 'America/Toronto', label: 'Montreal (EST / EDT)', city: 'Montreal', region: 'Americas' },
  { value: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)', city: 'New Delhi', region: 'Asia' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST / NZDT)', city: 'Auckland', region: 'Pacific' },
]
